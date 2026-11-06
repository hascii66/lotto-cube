"""Download real Sanook results into a JSON array importable by LottoCube."""

import argparse
import json
import os
from pathlib import Path
import re
import shutil
import sys
import tempfile
import time
from datetime import date, datetime, timezone
from urllib.parse import urljoin, urlparse
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

import requests
from bs4 import BeautifulSoup
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

BASE = "https://news.sanook.com"
DEFAULT_OUTPUT = Path(__file__).resolve().parents[1] / "data" / "lotto-history.json"
AWARDS = {
    "รางวัลที่ 1": ("prize1", 6, 1),
    "เลขหน้า 3 ตัว": ("front3", 3, 2),
    "เลขท้าย 3 ตัว": ("back3", 3, 2),
    "เลขท้าย 2 ตัว": ("last2", 2, 1),
}


def bangkok_today():
    try:
        return datetime.now(ZoneInfo("Asia/Bangkok")).date()
    except ZoneInfoNotFoundError:
        # Windows Python can omit IANA tzdata. Bangkok has a fixed UTC+7 offset.
        from datetime import timedelta, timezone
        return datetime.now(timezone(timedelta(hours=7))).date()


def draw_date(url):
    parsed = urlparse(urljoin(BASE, url))
    match = re.fullmatch(r"/lotto/check/(\d{2})(\d{2})(\d{4})/?", parsed.path)
    if parsed.hostname != "news.sanook.com" or not match:
        raise ValueError("ลิงก์งวดไม่ใช่หน้าผลสลาก Sanook ที่รองรับ")
    day, month, year = map(int, match.groups())
    return date(year - 543 if year > 2400 else year, month, day).isoformat()


def validate_draw(draw):
    if not isinstance(draw, dict):
        raise ValueError("แต่ละงวดต้องเป็น object")
    value = draw.get("date", "")
    if not isinstance(value, str) or not re.fullmatch(r"\d{4}-\d{2}-\d{2}", value):
        raise ValueError("วันที่ต้องเป็น YYYY-MM-DD")
    parsed = date.fromisoformat(value)
    if parsed < date(1900, 1, 1) or parsed > bangkok_today():
        raise ValueError("วันที่อยู่นอกช่วงที่รองรับหรือยังไม่ถึงวันออกรางวัล")
    result = {"date": value}
    for key, digits, count in AWARDS.values():
        values = draw.get(key) if count == 2 else [draw.get(key)]
        if not isinstance(values, list) or len(values) != count or not all(
            isinstance(n, str) and re.fullmatch(rf"[0-9]{{{digits}}}", n)
            for n in values
        ):
            raise ValueError(f"{value}: {key} ต้องมี {count} ชุด ชุดละ {digits} หลัก")
        result[key] = values if count == 2 else values[0]
    return result


def parse_card(card):
    url = card.get("href", "")
    result = {"date": draw_date(url)}
    stamp = card.select_one("time[datetime]")
    if stamp and stamp["datetime"] != result["date"]:
        raise ValueError("วันที่บนหน้าเว็บไม่ตรงกับรหัสงวดในลิงก์")
    for item in card.select(".archive--lotto__result-list > li"):
        label = item.select_one(".archive--lotto__result-txt")
        number = item.select_one(".archive--lotto__result-number")
        if not label or not number:
            continue
        text = label.get_text(" ", strip=True)
        for name, (key, _, count) in AWARDS.items():
            if text.endswith(name):
                if key in result:
                    raise ValueError(f"พบช่องรางวัล {key} ซ้ำในงวดเดียวกัน")
                values = number.get_text(" ", strip=True).split()
                result[key] = values if count == 2 else values[0] if len(values) == 1 else ""
    return validate_draw(result)


def archive_cards(html):
    soup = BeautifulSoup(html, "html.parser")
    # Archive cards already contain all six winning numbers. No need to request
    # another 120 result pages or guess numbers from unrelated page text.
    return [a for a in soup.select("a[href]") if a.select_one(".archive--lotto__result-list")]


def read_existing(path, skip_invalid=False):
    if not path.exists():
        return {}
    rows = json.loads(path.read_text(encoding="utf-8-sig"))
    if not isinstance(rows, list) or not rows or len(rows) > 10000:
        raise ValueError("ไฟล์เดิมต้องเป็น JSON array ที่มี 1–10,000 งวด จึงจะรันต่อได้")
    draws = []
    for row in rows:
        try:
            draws.append(validate_draw(row))
        except (ValueError, TypeError):
            if not skip_invalid:
                raise
    if len({row["date"] for row in draws}) != len(draws):
        raise ValueError("ไฟล์เดิมมีวันที่ซ้ำ กรุณาตรวจสอบก่อนรันต่อ")
    return {row["date"]: row for row in draws}


def save_atomic(path, draws, metadata=False):
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary = None
    try:
        with tempfile.NamedTemporaryFile(mode="w", encoding="utf-8", dir=path.parent,
                                         suffix=".tmp", delete=False, newline="\n") as handle:
            temporary = Path(handle.name)
            json.dump(draws if metadata else sorted(draws.values(), key=lambda d: d["date"], reverse=True),
                      handle, ensure_ascii=False, indent=2)
            handle.write("\n")
            handle.flush()
            os.fsync(handle.fileno())
        os.replace(temporary, path)
    finally:
        if temporary and temporary.exists():
            temporary.unlink()


def years_ago(years):
    today = bangkok_today()
    try:
        return today.replace(year=today.year - years)
    except ValueError:
        return today.replace(year=today.year - years, day=28)


def fetch_history(max_draws, output, delay, since=None, first_html=None, existing=None):
    history = read_existing(output) if existing is None else existing
    if output.exists():
        shutil.copy2(output, output.with_suffix(output.suffix + ".bak"))
    session = requests.Session()
    session.headers["User-Agent"] = "LottoCube/0.1 (historical lottery data collection)"
    session.mount("https://", HTTPAdapter(max_retries=Retry(
        total=2, backoff_factor=1, status_forcelist=[429, 500, 502, 503, 504],
        allowed_methods=["GET"], respect_retry_after_header=True,
    )))
    selected = set()
    page = 1
    reached_boundary = False
    try:
        while len(selected) < max_draws and not reached_boundary:
            url = f"{BASE}/lotto/archive/" if page == 1 else f"{BASE}/lotto/archive/page/{page}/"
            target = f'ย้อนหลังถึง {since.isoformat()}' if since else f'เป้าหมาย {max_draws} งวด'
            print(f"อ่าน archive หน้า {page} · {target} · ตรวจแล้ว {len(selected)} งวด", flush=True)
            if page == 1 and first_html is not None:
                html = first_html
            else:
                response = session.get(url, timeout=(10, 30))
                response.raise_for_status()
                response.encoding = "utf-8"
                html = response.text
            cards = archive_cards(html)
            if not cards:
                raise ValueError("ไม่พบช่องผลสลาก โครงสร้างหน้าเว็บอาจเปลี่ยน ข้อมูลที่บันทึกแล้วไม่ถูกลบ")
            # Sort by actual draw date, independent of card positions or duplicates.
            cards.sort(key=lambda card: draw_date(card.get("href", "")), reverse=True)
            before = len(selected)
            for card in cards:
                iso_date = draw_date(card.get("href", ""))
                if iso_date > bangkok_today().isoformat() or iso_date in selected:
                    continue
                if since and iso_date < since.isoformat():
                    reached_boundary = True
                    break
                try:
                    draw = parse_card(card)
                except ValueError:
                    if iso_date == bangkok_today().isoformat():
                        continue  # Today's result may still be in progress.
                    raise
                history[draw["date"]] = draw
                selected.add(draw["date"])
                if len(selected) == max_draws:
                    break
            if len(selected) == before and not reached_boundary:
                raise ValueError("ไม่มีงวดเพิ่มในหน้าถัดไป จึงหยุดเพื่อไม่วนดึงข้อมูลซ้ำ")
            save_atomic(output, history)
            print(f"บันทึกแล้ว {len(history)} งวด · ล่าสุด {max(history)}", flush=True)
            page += 1
            if len(selected) < max_draws and not reached_boundary:
                time.sleep(delay)
    finally:
        session.close()
    if since:
        save_atomic(output.with_suffix('.meta.json'), {
            "since": since.isoformat(), "latest": max(selected),
            "dates": sorted(selected, reverse=True),
            "checkedAt": datetime.now(timezone.utc).isoformat(),
        }, metadata=True)
    return history


def ensure_history(output=DEFAULT_OUTPUT, years=10):
    """One lightweight source check; collect the full window only if incomplete."""
    history = read_existing(output, skip_invalid=True)
    meta_path = output.with_suffix('.meta.json')
    try:
        meta = json.loads(meta_path.read_text(encoding='utf-8'))
    except (OSError, ValueError):
        meta = {}
    response = requests.get(f'{BASE}/lotto/archive/', timeout=(10, 20))
    response.raise_for_status()
    response.encoding = 'utf-8'
    latest = []
    for card in archive_cards(response.text):
        day = draw_date(card.get('href', ''))
        if day > bangkok_today().isoformat():
            continue
        try:
            latest.append(parse_card(card))
        except ValueError:
            if day != bangkok_today().isoformat():
                raise
    if not latest:
        raise ValueError('ยังตรวจสอบงวดล่าสุดจากแหล่งข้อมูลไม่ได้')
    newest = max(d['date'] for d in latest)
    cutoff = years_ago(years)
    expected = {d for d in meta.get('dates', []) if d >= cutoff.isoformat()}
    complete = (meta.get('since', '9999') <= cutoff.isoformat()
                and meta.get('latest') == newest and bool(expected)
                and expected.issubset(history))
    if not complete:
        history = fetch_history(10000, output, 0.5, since=cutoff, first_html=response.text, existing=history)
        meta = json.loads(meta_path.read_text(encoding='utf-8'))
    meta['checkedAt'] = datetime.now(timezone.utc).isoformat()
    save_atomic(meta_path, meta, metadata=True)
    return history, meta


def main():
    parser = argparse.ArgumentParser(description="ดึงผลสลาก Sanook แล้วบันทึก JSON สำหรับ LottoCube")
    group = parser.add_mutually_exclusive_group()
    group.add_argument("--draws", type=int, help="จำนวนงวดล่าสุด (ใช้แทน --years)")
    group.add_argument("--years", type=int, default=None, help="ย้อนหลังตามปีปฏิทิน ค่าเริ่มต้น 10 ปี")
    parser.add_argument('--ensure', action='store_true', help='ตรวจและเติมเฉพาะเมื่อข้อมูลสิบปีไม่ครบ')
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT, help="ไฟล์ JSON ปลายทาง")
    parser.add_argument("--delay", type=float, default=0.5, help="เวลาพักระหว่างหน้า archive หน่วยวินาที")
    args = parser.parse_args()
    if (args.draws is not None and not 1 <= args.draws <= 10000) or (args.years is not None and not 1 <= args.years <= 10) or not 0.25 <= args.delay <= 60:
        parser.error("จำนวนงวดต้องอยู่ระหว่าง 1–10,000 และเวลาพัก 0.25–60 วินาที")
    try:
        if args.ensure:
            history, _ = ensure_history(args.output.resolve(), args.years or 10)
        else:
            history = fetch_history(args.draws or 10000, args.output.resolve(), args.delay,
                                    since=None if args.draws else years_ago(args.years or 10))
    except (requests.RequestException, ValueError, OSError, KeyboardInterrupt) as error:
        print(f"หยุดดึงข้อมูล: {error or 'ยกเลิกโดยผู้ใช้'}\nไฟล์ที่บันทึกสำเร็จแล้วยังอยู่ รันคำสั่งเดิมเพื่อทำต่อ", file=sys.stderr)
        return 1
    print(f"เสร็จแล้ว {len(history)} งวด: {args.output.resolve()}")
    print('ฐานข้อมูลพร้อมใช้ แอปจะอ่านและตรวจงวดล่าสุดอัตโนมัติ' if args.output.resolve() == DEFAULT_OUTPUT.resolve()
          else 'ไฟล์แยกพร้อมนำเข้าใน LottoCube ผ่านเมนูนำเข้า JSON')
    return 0


if __name__ == "__main__":
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    raise SystemExit(main())
