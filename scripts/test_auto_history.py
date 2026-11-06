import json
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch
from concurrent.futures import ThreadPoolExecutor

from fetch_lotto import ensure_history, parse_card, years_ago
from test_fetch_lotto import HTML
from bs4 import BeautifulSoup
import serve_lotto


class AutomaticHistoryTests(unittest.TestCase):
    def setup_archive(self, directory):
        path = Path(directory) / 'history.json'
        draw = parse_card(BeautifulSoup(HTML, 'html.parser').a)
        path.write_text(json.dumps([draw]), encoding='utf-8')
        meta = {'since': years_ago(10).isoformat(), 'latest': draw['date'], 'dates': [draw['date']], 'checkedAt': None}
        path.with_suffix('.meta.json').write_text(json.dumps(meta), encoding='utf-8')
        return path, draw, meta

    @patch('fetch_lotto.requests.get')
    @patch('fetch_lotto.fetch_history')
    def test_complete_window_only_checks_source_and_does_not_rewrite_history(self, crawl, get):
        get.return_value.text = HTML
        with tempfile.TemporaryDirectory() as directory:
            path, draw, _ = self.setup_archive(directory)
            before = path.stat().st_mtime_ns
            history, meta = ensure_history(path)
            self.assertEqual(history[draw['date']], draw)
            self.assertIsNotNone(meta['checkedAt'])
            self.assertEqual(path.stat().st_mtime_ns, before)
            crawl.assert_not_called()
            get.assert_called_once()

    @patch('fetch_lotto.requests.get')
    @patch('fetch_lotto.fetch_history')
    def test_missing_or_incomplete_award_triggers_full_repair(self, crawl, get):
        get.return_value.text = HTML
        for broken in ({'date': '2024-12-16'}, {'date': '2024-12-01'}):
            with self.subTest(broken=broken), tempfile.TemporaryDirectory() as directory:
                path, draw, _ = self.setup_archive(directory)
                path.write_text(json.dumps([broken]), encoding='utf-8')
                crawl.reset_mock()
                crawl.return_value = {draw['date']: draw}
                history, _ = ensure_history(path)
                self.assertEqual(history[draw['date']], draw)
                self.assertEqual(crawl.call_count, 1)
                self.assertEqual(crawl.call_args.kwargs['since'], years_ago(10))
                self.assertEqual(crawl.call_args.kwargs['existing'], {})

    @patch('fetch_lotto.requests.get')
    @patch('fetch_lotto.fetch_history')
    def test_source_newer_than_manifest_triggers_update(self, crawl, get):
        get.return_value.text = HTML
        with tempfile.TemporaryDirectory() as directory:
            path, draw, meta = self.setup_archive(directory)
            meta['latest'] = '2024-12-01'
            path.with_suffix('.meta.json').write_text(json.dumps(meta), encoding='utf-8')
            crawl.return_value = {draw['date']: draw}
            ensure_history(path)
            crawl.assert_called_once()

    def test_concurrent_visitors_share_one_check(self):
        draw = parse_card(BeautifulSoup(HTML, 'html.parser').a)
        with patch.object(serve_lotto, 'LAST_ATTEMPT', 0), patch.object(serve_lotto, 'ensure_history', return_value=({}, {'checkedAt': '2026-11-05T12:00:00Z'})) as ensure, patch.object(serve_lotto, 'read_existing', return_value={draw['date']: draw}):
            with ThreadPoolExecutor(max_workers=4) as pool:
                responses = list(pool.map(lambda _: serve_lotto.history_response(), range(4)))
            self.assertTrue(all(r['status'] == 'current' for r in responses))
            ensure.assert_called_once()

    def test_source_failure_returns_saved_data_with_stale_status(self):
        draw = parse_card(BeautifulSoup(HTML, 'html.parser').a)
        with patch.object(serve_lotto, 'LAST_ATTEMPT', 0), patch.object(serve_lotto, 'ensure_history', side_effect=OSError('offline')), patch.object(serve_lotto, 'read_existing', return_value={draw['date']: draw}):
            response = serve_lotto.history_response()
            self.assertEqual(response['status'], 'stale')
            self.assertEqual(len(response['draws']), 1)


if __name__ == '__main__':
    unittest.main()
