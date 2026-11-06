import json
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch

from bs4 import BeautifulSoup

from fetch_lotto import archive_cards, draw_date, fetch_history, parse_card, read_existing, save_atomic, validate_draw


# Real 16 December 2024 result; fixture has the same labelled structure as Sanook.
HTML = '''<a href="/lotto/check/16122567/">
<time datetime="2024-12-16"></time><ul class="archive--lotto__result-list">
<li><em class="archive--lotto__result-txt">ผลสลากกินแบ่งรัฐบาล รางวัลที่ 1</em><strong class="archive--lotto__result-number">097863</strong></li>
<li><em class="archive--lotto__result-txt">ผลสลากกินแบ่งรัฐบาล เลขหน้า 3 ตัว</em><strong class="archive--lotto__result-number"><span>290</span><span>742</span></strong></li>
<li><em class="archive--lotto__result-txt">ผลสลากกินแบ่งรัฐบาล เลขท้าย 3 ตัว</em><strong class="archive--lotto__result-number"><span>339</span><span>881</span></strong></li>
<li><em class="archive--lotto__result-txt">ผลสลากกินแบ่งรัฐบาล เลขท้าย 2 ตัว</em><strong class="archive--lotto__result-number">21</strong></li>
</ul></a>'''


class FetchTests(unittest.TestCase):
    def card(self, html=HTML):
        return BeautifulSoup(html, "html.parser").a

    def test_reads_labelled_awards_preserving_zeros(self):
        draw = parse_card(self.card())
        self.assertEqual(draw, {"date": "2024-12-16", "prize1": "097863", "front3": ["290", "742"], "back3": ["339", "881"], "last2": "21"})
        self.assertEqual(len(archive_cards(HTML + '<a href="/unrelated/">other news</a>')), 1)

    def test_rejects_incomplete_results_without_guessing_from_reward_amounts(self):
        with self.assertRaises(ValueError):
            parse_card(self.card(HTML.replace("097863", "รอผล")))
        with self.assertRaises(ValueError):
            parse_card(self.card(HTML.replace("<span>742</span>", "")))
        with self.assertRaises(ValueError):
            validate_draw({**parse_card(self.card()), "prize1": 97863})

    def test_rejects_mismatched_dates_and_external_urls(self):
        with self.assertRaises(ValueError):
            parse_card(self.card(HTML.replace('datetime="2024-12-16"', 'datetime="2024-12-01"')))
        for url in ["https://example.com/lotto/check/16122567/", "/lotto/check/31022567/", "/lotto/check/not-a-date/"]:
            with self.subTest(url=url), self.assertRaises(ValueError):
                draw_date(url)

    def test_atomic_json_roundtrip_and_no_overwrite_of_invalid_existing_file(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "results.json"
            draw = parse_card(self.card())
            save_atomic(path, {draw["date"]: draw})
            self.assertEqual(read_existing(path), {draw["date"]: draw})
            self.assertEqual(list(path.parent.glob("*.tmp")), [])
            path.write_text("not-json", encoding="utf-8")
            with self.assertRaises(ValueError):
                read_existing(path)
            self.assertEqual(path.read_text(encoding="utf-8"), "not-json")

    def test_saves_completed_pages_and_stops_repeated_pages(self):
        with tempfile.TemporaryDirectory() as directory, patch("fetch_lotto.requests.Session") as make_session:
            session = make_session.return_value
            session.get.return_value.text = HTML
            # The second page repeats the first: stop instead of looping forever.
            path = Path(directory) / "results.json"
            with self.assertRaises(ValueError):
                fetch_history(2, path, 0)
            self.assertEqual(len(json.loads(path.read_text(encoding="utf-8"))), 1)
            session.close.assert_called_once()


if __name__ == "__main__":
    unittest.main()
