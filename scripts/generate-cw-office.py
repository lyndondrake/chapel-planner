#!/usr/bin/env python3
"""Generate CW weekday office lectionary readings (Morning Prayer & Evening Prayer).

This is a one-year cycle (no A/B/C variation). Each weekday has two readings
for Morning Prayer and two for Evening Prayer.
"""

import json
import re
import os

def parse_reference(ref):
    """Parse a biblical reference into book, chapter, verseStart, verseEnd."""
    ref = ref.strip()

    # Single-chapter books: Obadiah, Philemon, 2 John, 3 John, Jude
    single_chapter = ['Obadiah', 'Philemon', '2 John', '3 John', 'Jude']
    for book in single_chapter:
        if ref == book:
            return book, '1', None, None
        if ref.startswith(book + ' ') and '.' not in ref:
            rest = ref[len(book)+1:]
            m = re.match(r'(\d+)-(\d+)', rest)
            if m:
                return book, '1', m.group(1), m.group(2)
            m = re.match(r'(\d+)', rest)
            if m:
                return book, '1', m.group(1), None

    # Cross-chapter span: e.g. "Isaiah 52.13—53.12" or "Isaiah 4.2—5.7"
    m = re.match(r'^(.+?)\s+(\d+)\.(\d+)\s*[—–]\s*(\d+)\.(\d+\w?)$', ref)
    if m:
        return m.group(1), m.group(2), m.group(3), None

    # Cross-chapter span without verses: e.g. "Isaiah 63.7—64.5"
    m = re.match(r'^(.+?)\s+(\d+)\.(\d+)\s*[—–]\s*(\d+)\.(\d+)$', ref)
    if m:
        return m.group(1), m.group(2), m.group(3), None

    # Cross-chapter whole chapters: e.g. "Numbers 5.5-7; 6.1-21"
    m = re.match(r'^(.+?)\s+(\d+)\.(\d+)', ref)
    if m and ';' in ref:
        return m.group(1), m.group(2), m.group(3), None

    # Standard: "Book chapter.verseStart-verseEnd"
    m = re.match(r'^(.+?)\s+(\d+)\.(\d+)\s*-\s*(\d+\w?)$', ref)
    if m:
        return m.group(1), m.group(2), m.group(3), m.group(4)

    # Complex verse range: "Book chapter.verses,more"
    m = re.match(r'^(.+?)\s+(\d+)\.(.+)$', ref)
    if m:
        verses = m.group(3)
        # Get first verse number
        first = re.match(r'(\d+)', verses)
        # Get last verse number
        numbers = re.findall(r'(\d+)', verses)
        vs = first.group(1) if first else None
        ve = numbers[-1] if len(numbers) > 1 else None
        return m.group(1), m.group(2), vs, ve

    # Whole chapter: "Book chapter"
    m = re.match(r'^(.+?)\s+(\d+)$', ref)
    if m:
        return m.group(1), m.group(2), None, None

    # Just a book name
    return ref, None, None, None


def make_entry(slug, context, reading_type, reference, sort_order):
    """Create a reading entry dict."""
    book, chapter, vs, ve = parse_reference(reference)
    return {
        "occasionSlug": slug,
        "tradition": "cw",
        "serviceContext": context,
        "readingType": reading_type,
        "reference": reference,
        "book": book,
        "chapter": chapter,
        "verseStart": vs,
        "verseEnd": ve,
        "alternateYear": None,
        "isOptional": False,
        "sortOrder": sort_order
    }


def parse_day_line(line):
    """Parse a line like 'slug: MP: ref1, ref2; EP: ref3, ref4' and return entries."""
    entries = []
    # Format: "slug: MP: ot_ref, nt_ref; EP: ot_ref, nt_ref"
    m = re.match(r'^(\S+):\s*MP:\s*(.+?);\s*EP:\s*(.+)$', line.strip())
    if not m:
        return entries

    slug = m.group(1)
    mp_refs = [r.strip() for r in m.group(2).split(',', 1)]
    ep_refs = [r.strip() for r in m.group(3).split(',', 1)]

    if len(mp_refs) >= 2:
        entries.append(make_entry(slug, "morning_prayer", "old_testament", mp_refs[0], 1))
        entries.append(make_entry(slug, "morning_prayer", "second_reading", mp_refs[1], 2))
    if len(ep_refs) >= 2:
        entries.append(make_entry(slug, "evening_prayer", "old_testament", ep_refs[0], 1))
        entries.append(make_entry(slug, "evening_prayer", "second_reading", ep_refs[1], 2))

    return entries


# The full CW Weekday Office Lectionary data
DATA = """
advent-1-mon: MP: Isaiah 1.1-20, Matthew 12.1-21; EP: Isaiah 1.21-31, Matthew 12.22-50
advent-1-tue: MP: Isaiah 2.1-11, Matthew 13.1-23; EP: Isaiah 2.12-22, Matthew 13.24-43
advent-1-wed: MP: Isaiah 3.1-15, Matthew 13.44-58; EP: Isaiah 4.2—5.7, Matthew 14.1-12
advent-1-thu: MP: Isaiah 5.8-24, Matthew 14.13-36; EP: Isaiah 5.25-30, Matthew 15.1-20
advent-1-fri: MP: Isaiah 6, Matthew 15.21-39; EP: Isaiah 7.1-9, Matthew 16.1-12
advent-1-sat: MP: Isaiah 7.10-25, Matthew 16.13-28; EP: Isaiah 8.1-15, Matthew 17.1-13
advent-2-mon: MP: Isaiah 8.16—9.7, Matthew 17.14-27; EP: Isaiah 9.8—10.4, Matthew 18.1-20
advent-2-tue: MP: Isaiah 10.5-19, Matthew 18.21-35; EP: Isaiah 10.20-32, Matthew 19.1-15
advent-2-wed: MP: Isaiah 10.33—11.9, Matthew 19.16-30; EP: Isaiah 11.10—12.6, Matthew 20.1-16
advent-2-thu: MP: Isaiah 13.1-13, Matthew 20.17-34; EP: Isaiah 14.3-20, Matthew 21.1-17
advent-2-fri: MP: Isaiah 17, Matthew 21.18-32; EP: Isaiah 19, Matthew 21.33-46
advent-2-sat: MP: Isaiah 21.1-12, Matthew 22.1-14; EP: Isaiah 22.1-14, Matthew 22.15-33
advent-3-mon: MP: Isaiah 22.15-25, Matthew 22.34-46; EP: Isaiah 24, Matthew 23.1-12
advent-3-tue: MP: Isaiah 25, Matthew 23.13-28; EP: Isaiah 26.1-13, Matthew 23.29-39
advent-3-wed: MP: Isaiah 26.14—27.1, Matthew 24.1-14; EP: Isaiah 27.2-13, Matthew 24.15-28
advent-3-thu: MP: Isaiah 28.1-13, Matthew 24.29-44; EP: Isaiah 28.14-29, Matthew 24.45—25.13
advent-3-fri: MP: Isaiah 29.1-14, Matthew 25.14-30; EP: Isaiah 29.15-24, Matthew 25.31-46
advent-3-sat: MP: Isaiah 30.1-18, Matthew 26.1-16; EP: Isaiah 30.19-33, Matthew 26.17-35
advent-4-mon: MP: Isaiah 31, Matthew 26.36-56; EP: Isaiah 32, Matthew 26.57-75
advent-4-tue: MP: Isaiah 33.1-12, Matthew 27.1-10; EP: Isaiah 33.13-24, Matthew 27.11-26
advent-4-wed: MP: Isaiah 34, Matthew 27.27-44; EP: Isaiah 35, Matthew 27.45-56
advent-4-thu: MP: Isaiah 36, Matthew 27.57-66; EP: Isaiah 37.1-20, Matthew 28
advent-4-fri: MP: Isaiah 37.21-38, Luke 1.1-25; EP: Isaiah 38, Luke 1.26-38
advent-4-sat: MP: Isaiah 39, Luke 1.39-56; EP: Isaiah 40.1-11, Luke 1.57-80
christmas-dec-26: MP: 2 Chronicles 24.20-22, Acts 6; EP: Genesis 4.1-10, Matthew 23.34-39
christmas-dec-27: MP: Exodus 33.7-11a, 1 John 1; EP: Isaiah 6.1-8, 1 John 5.1-12
christmas-dec-28: MP: Jeremiah 31.1-17, Matthew 18.1-10; EP: Isaiah 49.14-25, Mark 10.13-16
christmas-dec-29: MP: Isaiah 40.12-26, 1 John 2.1-11; EP: Isaiah 40.27—41.7, 1 John 2.12-17
christmas-dec-30: MP: Isaiah 41.8-20, 1 John 2.18-29; EP: Isaiah 41.21—42.9, 1 John 3.1-10
christmas-dec-31: MP: Isaiah 42.10-25, 1 John 3.11-21; EP: Isaiah 43.1-13, 1 John 3.22—4.6
christmas-jan-1: MP: Isaiah 43.14—44.5, 1 John 4.7-21; EP: Isaiah 44.6-23, 1 John 5.1-12
epiphany-1-mon: MP: Isaiah 44.24—45.8, Ephesians 1.1-14; EP: Isaiah 45.9-22, Ephesians 1.15-23
epiphany-1-tue: MP: Isaiah 45.23—46.13, Ephesians 2.1-10; EP: Isaiah 47, Ephesians 2.11-22
epiphany-1-wed: MP: Isaiah 48.1-11, Ephesians 3.1-13; EP: Isaiah 48.12-22, Ephesians 3.14-21
epiphany-1-thu: MP: Isaiah 49.1-13, Ephesians 4.1-16; EP: Isaiah 49.14-25, Ephesians 4.17-32
epiphany-1-fri: MP: Isaiah 50, Ephesians 5.1-14; EP: Isaiah 51.1-8, Ephesians 5.15-33
epiphany-1-sat: MP: Isaiah 51.9-16, Ephesians 6.1-9; EP: Isaiah 51.17—52.12, Ephesians 6.10-24
epiphany-2-mon: MP: Isaiah 52.13—53.12, Galatians 1; EP: Isaiah 54, Galatians 2.1-10
epiphany-2-tue: MP: Isaiah 55, Galatians 2.11-21; EP: Isaiah 56.1-8, Galatians 3.1-14
epiphany-2-wed: MP: Isaiah 56.9—57.13, Galatians 3.15-29; EP: Isaiah 57.14-21, Galatians 4.1-11
epiphany-2-thu: MP: Isaiah 58, Galatians 4.12-20; EP: Isaiah 59.1-15a, Galatians 4.21—5.1
epiphany-2-fri: MP: Isaiah 59.15b-21, Galatians 5.2-15; EP: Isaiah 60, Galatians 5.16-26
epiphany-2-sat: MP: Isaiah 61, Galatians 6; EP: Isaiah 62, Philippians 1.1-11
epiphany-3-mon: MP: Isaiah 63.1-6, Philippians 1.12-26; EP: Isaiah 63.7—64.5, Philippians 1.27—2.4
epiphany-3-tue: MP: Isaiah 64.6—65.7, Philippians 2.5-18; EP: Isaiah 65.8-16, Philippians 2.19-30
epiphany-3-wed: MP: Isaiah 65.17-25, Philippians 3.1-11; EP: Isaiah 66.1-9, Philippians 3.12—4.1
epiphany-3-thu: MP: Isaiah 66.10-16, Philippians 4.2-9; EP: Isaiah 66.17-24, Philippians 4.10-23
epiphany-3-fri: MP: Jeremiah 1.1-10, Mark 1.1-13; EP: Jeremiah 1.11-19, Mark 1.14-28
epiphany-3-sat: MP: Jeremiah 2.1-13, Mark 1.29-45; EP: Jeremiah 2.14-32, Mark 2.1-12
epiphany-4-mon: MP: Jeremiah 3.6-22, Mark 2.13-22; EP: Jeremiah 4.1-14, Mark 2.23—3.6
epiphany-4-tue: MP: Jeremiah 4.15-31, Mark 3.7-19a; EP: Jeremiah 5.1-19, Mark 3.19b-35
epiphany-4-wed: MP: Jeremiah 5.20-31, Mark 4.1-20; EP: Jeremiah 6.1-15, Mark 4.21-34
epiphany-4-thu: MP: Jeremiah 6.16-30, Mark 4.35-41; EP: Jeremiah 7.1-20, Mark 5.1-20
epiphany-4-fri: MP: Jeremiah 7.21-34, Mark 5.21-34; EP: Jeremiah 8.1-12, Mark 5.35-43
epiphany-4-sat: MP: Jeremiah 8.13-22, Mark 6.1-13; EP: Jeremiah 9.1-11, Mark 6.14-29
before-lent-2-mon: MP: Jeremiah 9.12-24, Mark 6.30-44; EP: Jeremiah 10.1-16, Mark 6.45-56
before-lent-2-tue: MP: Jeremiah 10.17-24, Mark 7.1-13; EP: Jeremiah 11.1-17, Mark 7.14-23
before-lent-2-wed: MP: Jeremiah 11.18—12.6, Mark 7.24-30; EP: Jeremiah 12.7-17, Mark 7.31-37
before-lent-2-thu: MP: Jeremiah 13.1-11, Mark 8.1-10; EP: Jeremiah 13.12-27, Mark 8.11-21
before-lent-2-fri: MP: Jeremiah 14.1-10, Mark 8.22-33; EP: Jeremiah 14.11-22, Mark 8.34—9.1
before-lent-2-sat: MP: Jeremiah 15.1-14, Mark 9.2-13; EP: Jeremiah 15.15-21, Mark 9.14-29
before-lent-1-mon: MP: Jeremiah 16.1-13, Mark 9.30-37; EP: Jeremiah 16.14-21, Mark 9.38-50
before-lent-1-tue: MP: Jeremiah 17.1-11, Mark 10.1-16; EP: Jeremiah 17.12-18, Mark 10.17-31
before-lent-1-wed: MP: Jeremiah 17.19-27, Mark 10.32-45; EP: Jeremiah 18.1-12, Mark 10.46-52
before-lent-1-thu: MP: Jeremiah 18.13-23, Mark 11.1-11; EP: Jeremiah 19, Mark 11.12-26
before-lent-1-fri: MP: Jeremiah 20.1-6, Mark 11.27-33; EP: Jeremiah 20.7-18, Mark 12.1-12
before-lent-1-sat: MP: Jeremiah 21.1-10, Mark 12.13-27; EP: Jeremiah 22.1-12, Mark 12.28-34
lent-1-mon: MP: Jeremiah 22.13-23, Mark 12.35-44; EP: Jeremiah 22.24-30, Mark 13.1-13
lent-1-tue: MP: Jeremiah 23.1-8, Mark 13.14-27; EP: Jeremiah 23.9-32, Mark 13.28-37
lent-1-wed: MP: Jeremiah 24, Mark 14.1-11; EP: Jeremiah 25.1-14, Mark 14.12-25
lent-1-thu: MP: Jeremiah 25.15-31, Mark 14.26-42; EP: Jeremiah 25.32-38, Mark 14.43-52
lent-1-fri: MP: Jeremiah 26, Mark 14.53-65; EP: Jeremiah 27, Mark 14.66-72
lent-1-sat: MP: Jeremiah 28, Mark 15.1-15; EP: Jeremiah 29.1-14, Mark 15.16-32
lent-2-mon: MP: Jeremiah 30.1-11, Mark 15.33-41; EP: Jeremiah 30.12-22, Mark 15.42-47
lent-2-tue: MP: Jeremiah 31.1-14, Mark 16; EP: Jeremiah 31.15-22, Luke 1.1-25
lent-2-wed: MP: Jeremiah 31.23-37, Luke 1.26-38; EP: Jeremiah 32.1-15, Luke 1.39-56
lent-2-thu: MP: Jeremiah 32.16-35, Luke 1.57-66; EP: Jeremiah 33.1-13, Luke 1.67-80
lent-2-fri: MP: Jeremiah 33.14-26, Luke 2.1-20; EP: Jeremiah 34.1-7, Luke 2.21-40
lent-2-sat: MP: Jeremiah 35, Luke 2.41-52; EP: Jeremiah 36.1-18, Luke 3.1-14
lent-3-mon: MP: Jeremiah 36.19-32, Luke 3.15-22; EP: Jeremiah 37.1-10, Luke 4.1-13
lent-3-tue: MP: Jeremiah 37.11-21, Luke 4.14-30; EP: Jeremiah 38.1-13, Luke 4.31-37
lent-3-wed: MP: Jeremiah 38.14-28, Luke 4.38-44; EP: Jeremiah 39, Luke 5.1-11
lent-3-thu: MP: Jeremiah 40.1-12, Luke 5.12-26; EP: Jeremiah 41, Luke 5.27-39
lent-3-fri: MP: Jeremiah 42, Luke 6.1-11; EP: Jeremiah 43, Luke 6.12-26
lent-3-sat: MP: Jeremiah 44.1-14, Luke 6.27-38; EP: Jeremiah 44.15-30, Luke 6.39-49
lent-4-mon: MP: Jeremiah 46.1-12, Luke 7.1-10; EP: Jeremiah 46.13-28, Luke 7.11-17
lent-4-tue: MP: Jeremiah 47, Luke 7.18-35; EP: Jeremiah 48.1-13, Luke 7.36-50
lent-4-wed: MP: Jeremiah 48.14-36, Luke 8.1-15; EP: Jeremiah 49.1-6, Luke 8.16-25
lent-4-thu: MP: Jeremiah 49.7-22, Luke 8.26-39; EP: Jeremiah 49.23-39, Luke 8.40-56
lent-4-fri: MP: Jeremiah 50.1-20, Luke 9.1-17; EP: Jeremiah 50.21-46, Luke 9.18-27
lent-4-sat: MP: Jeremiah 51.1-10, Luke 9.28-36; EP: Jeremiah 51.54-64, Luke 9.37-50
lent-5-mon: MP: Lamentations 1.1-12, Luke 9.51-62; EP: Lamentations 1.13-22, Luke 10.1-16
lent-5-tue: MP: Lamentations 2.1-9, Luke 10.17-24; EP: Lamentations 2.10-19, Luke 10.25-37
lent-5-wed: MP: Lamentations 3.1-18, Luke 10.38-42; EP: Lamentations 3.19-39, Luke 11.1-13
lent-5-thu: MP: Lamentations 3.40-54, Luke 11.14-28; EP: Lamentations 3.55-66, Luke 11.29-36
lent-5-fri: MP: Lamentations 4, Luke 11.37-54; EP: Lamentations 5, Luke 12.1-12
lent-5-sat: MP: Ezekiel 1.1-14, Luke 12.13-34; EP: Ezekiel 1.15—2.2, Luke 12.35-48
easter-2-mon: MP: Exodus 12.1-14, 1 Corinthians 15.1-11; EP: Exodus 12.14-36, 1 Corinthians 15.12-19
easter-2-tue: MP: Exodus 12.37-51, 1 Corinthians 15.20-28; EP: Exodus 13.1-16, 1 Corinthians 15.29-34
easter-2-wed: MP: Exodus 13.17—14.4, 1 Corinthians 15.35-50; EP: Exodus 14.5-31, 1 Corinthians 15.51-58
easter-2-thu: MP: Exodus 15.1-21, 1 Corinthians 16.1-9; EP: Exodus 15.22—16.10, 1 Corinthians 16.10-24
easter-2-fri: MP: Exodus 16.11-36, 2 Corinthians 1.1-14; EP: Exodus 17, 2 Corinthians 1.15-22
easter-2-sat: MP: Exodus 18, 2 Corinthians 1.23—2.4; EP: Exodus 19, 2 Corinthians 2.5-17
easter-3-mon: MP: Exodus 20.1-21, 2 Corinthians 3; EP: Exodus 21.1-21, 2 Corinthians 4.1-6
easter-3-tue: MP: Exodus 22.1-20, 2 Corinthians 4.7-18; EP: Exodus 22.21—23.9, 2 Corinthians 5.1-10
easter-3-wed: MP: Exodus 23.10-33, 2 Corinthians 5.11—6.2; EP: Exodus 24, 2 Corinthians 6.3-18
easter-3-thu: MP: Exodus 25.1-22, 2 Corinthians 7.1-16; EP: Exodus 28.1-5,29-43, 2 Corinthians 8.1-15
easter-3-fri: MP: Exodus 29.1-9, 2 Corinthians 8.16—9.5; EP: Exodus 29.38—30.16, 2 Corinthians 9.6-15
easter-3-sat: MP: Exodus 32.1-14, 2 Corinthians 10; EP: Exodus 32.15-34, 2 Corinthians 11.1-15
easter-4-mon: MP: Exodus 33, 2 Corinthians 11.16-33; EP: Exodus 34.1-16, 2 Corinthians 12.1-10
easter-4-tue: MP: Exodus 34.17-35, 2 Corinthians 12.11-21; EP: Exodus 35.1—36.7, 2 Corinthians 13
easter-4-wed: MP: Exodus 40.17-38, Colossians 1.1-14; EP: Leviticus 8.1-13,30-36, Colossians 1.15-23
easter-4-thu: MP: Leviticus 9, Colossians 1.24—2.7; EP: Leviticus 16.2-24, Colossians 2.8-19
easter-4-fri: MP: Leviticus 17.1-9, Colossians 2.20—3.4; EP: Leviticus 19.1-18,30-37, Colossians 3.5-17
easter-4-sat: MP: Leviticus 23.1-22, Colossians 3.18—4.6; EP: Leviticus 23.23-44, Colossians 4.7-18
easter-5-mon: MP: Leviticus 25.1-24, 1 Timothy 1.1-17; EP: Leviticus 25.25-55, 1 Timothy 1.18—2.8
easter-5-tue: MP: Leviticus 26.1-13, 1 Timothy 2.9—3.7; EP: Leviticus 26.14-39, 1 Timothy 3.8-16
easter-5-wed: MP: Numbers 5.5-7; 6.1-21, 1 Timothy 4.1-10; EP: Numbers 6.22-27; 8.5-22, 1 Timothy 4.11—5.2
easter-5-thu: MP: Numbers 9.15-23; 10.33-36, 1 Timothy 5.3-16; EP: Numbers 11.1-33, 1 Timothy 5.17-25
easter-5-fri: MP: Numbers 12, 1 Timothy 6.1-10; EP: Numbers 13.1-3,17-33, 1 Timothy 6.11-21
easter-5-sat: MP: Numbers 14.1-25, Titus 1; EP: Numbers 14.26-45, Titus 2
easter-6-mon: MP: Numbers 16.1-35, Titus 3; EP: Numbers 16.36-50, 2 Timothy 1.1-14
easter-6-tue: MP: Numbers 17.1-11, 2 Timothy 1.15—2.13; EP: Numbers 20.1-13, 2 Timothy 2.14-26
easter-6-wed: MP: Numbers 21.4-9, 2 Timothy 3; EP: Numbers 22.1-35, 2 Timothy 4.1-8
easter-6-thu: MP: Numbers 22.36—23.12, 2 Timothy 4.9-22; EP: Numbers 23.13-26, Hebrews 1
easter-6-fri: MP: Numbers 24, Hebrews 2.1-9; EP: Numbers 25, Hebrews 2.10-18
easter-6-sat: MP: Numbers 27.12-23, Hebrews 3.1-6; EP: Deuteronomy 3.23-29, Hebrews 3.7-19
easter-7-mon: MP: Deuteronomy 4.1-14, Hebrews 4.1-13; EP: Deuteronomy 4.15-31, Hebrews 4.14—5.10
easter-7-tue: MP: Deuteronomy 4.32-40, Hebrews 5.11—6.12; EP: Deuteronomy 5.1-22, Hebrews 6.13-20
easter-7-wed: MP: Deuteronomy 5.22-33, Hebrews 7.1-10; EP: Deuteronomy 6, Hebrews 7.11-28
easter-7-thu: MP: Deuteronomy 7.1-11, Hebrews 8; EP: Deuteronomy 7.12-26, Hebrews 9.1-14
easter-7-fri: MP: Deuteronomy 8, Hebrews 9.15-28; EP: Deuteronomy 9.1-10, Hebrews 10.1-18
easter-7-sat: MP: Deuteronomy 9.11-24, Hebrews 10.19-25; EP: Deuteronomy 10.1-11, Hebrews 10.26-39
proper-4-mon: MP: Deuteronomy 10.12-22, Acts 1.1-14; EP: Deuteronomy 11.1-12, Acts 1.15-26
proper-4-tue: MP: Deuteronomy 11.13-28, Acts 2.1-21; EP: Deuteronomy 12.1-14, Acts 2.22-36
proper-4-wed: MP: Deuteronomy 15.1-18, Acts 2.37-47; EP: Deuteronomy 16.1-20, Acts 3.1-10
proper-4-thu: MP: Deuteronomy 17.8-20, Acts 3.11-26; EP: Deuteronomy 18.9-22, Acts 4.1-12
proper-4-fri: MP: Deuteronomy 19.1-13, Acts 4.13-31; EP: Deuteronomy 21.22—22.8, Acts 4.32—5.11
proper-4-sat: MP: Deuteronomy 24.5-22, Acts 5.12-26; EP: Deuteronomy 26.1-11, Acts 5.27-42
proper-5-mon: MP: Deuteronomy 28.1-14, Acts 6; EP: Deuteronomy 28.15-29, Acts 7.1-16
proper-5-tue: MP: Deuteronomy 28.58-68, Acts 7.17-34; EP: Deuteronomy 29.2-15, Acts 7.35-53
proper-5-wed: MP: Deuteronomy 30, Acts 7.54—8.3; EP: Deuteronomy 31.1-13, Acts 8.4-25
proper-5-thu: MP: Deuteronomy 31.14-29, Acts 8.26-40; EP: Deuteronomy 32.1-14, Acts 9.1-19a
proper-5-fri: MP: Deuteronomy 32.15-47, Acts 9.19b-31; EP: Deuteronomy 33.1-12, Acts 9.32-43
proper-5-sat: MP: Deuteronomy 33.13-29, Acts 10.1-16; EP: Deuteronomy 34, Acts 10.17-33
proper-6-mon: MP: Joshua 1, Acts 10.34-48; EP: Joshua 2, Acts 11.1-18
proper-6-tue: MP: Joshua 3, Acts 11.19-30; EP: Joshua 4.1—5.1, Acts 12.1-17
proper-6-wed: MP: Joshua 5.2-15, Acts 12.18-25; EP: Joshua 6.1-20, Acts 13.1-12
proper-6-thu: MP: Joshua 7.1-15, Acts 13.13-43; EP: Joshua 7.16-26, Acts 13.44—14.7
proper-6-fri: MP: Joshua 8.1-29, Acts 14.8-28; EP: Joshua 9.3-27, Acts 15.1-21
proper-6-sat: MP: Joshua 10.1-15, Acts 15.22-35; EP: Joshua 14.6-15, Acts 15.36—16.5
proper-7-mon: MP: Joshua 21.43—22.8, Acts 16.6-24; EP: Joshua 22.9-31, Acts 16.25-40
proper-7-tue: MP: Joshua 23, Acts 17.1-15; EP: Joshua 24.1-28, Acts 17.16-34
proper-7-wed: MP: Joshua 24.29-33; Judges 1.1-21, Acts 18.1-21; EP: Judges 2.6-23, Acts 18.22—19.7
proper-7-thu: MP: Judges 4.1-23, Acts 19.8-20; EP: Judges 5.1-12, Acts 19.21-41
proper-7-fri: MP: Judges 6.1-24, Acts 20.1-16; EP: Judges 6.25-40, Acts 20.17-38
proper-7-sat: MP: Judges 7.1-23, Acts 21.1-16; EP: Judges 8.22-35, Acts 21.17-36
proper-8-mon: MP: Judges 9.1-6,22-25,43-56, Acts 21.37—22.21; EP: Judges 10.6—11.11, Acts 22.22—23.11
proper-8-tue: MP: Judges 11.29-40, Acts 23.12-35; EP: Judges 12.1-7, Acts 24.1-23
proper-8-wed: MP: Judges 13.1-24, Acts 24.24—25.12; EP: Judges 14, Acts 25.13-27
proper-8-thu: MP: Judges 15.1-16, Acts 26.1-23; EP: Judges 16.1-14, Acts 26.24—27.8
proper-8-fri: MP: Judges 16.15-31, Acts 27.9-26; EP: Ruth 1, Acts 27.27-44
proper-8-sat: MP: Ruth 2, Acts 28.1-16; EP: Ruth 3, Acts 28.17-31
proper-9-mon: MP: Ruth 4.1-17, Luke 1.1-25; EP: 1 Samuel 1.1-20, Luke 1.26-38
proper-9-tue: MP: 1 Samuel 1.21—2.11, Luke 1.39-56; EP: 1 Samuel 2.12-26, Luke 1.57-80
proper-9-wed: MP: 1 Samuel 2.27-36, Luke 2.1-20; EP: 1 Samuel 3, Luke 2.21-40
proper-9-thu: MP: 1 Samuel 4.1-18, Luke 2.41-52; EP: 1 Samuel 5, Luke 3.1-20
proper-9-fri: MP: 1 Samuel 6.1-16, Luke 3.21-38; EP: 1 Samuel 7, Luke 4.1-13
proper-9-sat: MP: 1 Samuel 8, Luke 4.14-30; EP: 1 Samuel 9.1-14, Luke 4.31-37
proper-10-mon: MP: 1 Samuel 9.15—10.1, Luke 4.38-44; EP: 1 Samuel 10.1-16, Luke 5.1-11
proper-10-tue: MP: 1 Samuel 10.17-27, Luke 5.12-26; EP: 1 Samuel 11, Luke 5.27-39
proper-10-wed: MP: 1 Samuel 12, Luke 6.1-11; EP: 1 Samuel 13.1-18, Luke 6.12-26
proper-10-thu: MP: 1 Samuel 13.19—14.15, Luke 6.27-38; EP: 1 Samuel 14.24-46, Luke 6.39-49
proper-10-fri: MP: 1 Samuel 15.1-23, Luke 7.1-10; EP: 1 Samuel 15.24-35, Luke 7.11-17
proper-10-sat: MP: 1 Samuel 16, Luke 7.18-35; EP: 1 Samuel 17.1-30, Luke 7.36-50
proper-11-mon: MP: 1 Samuel 17.31-54, Luke 8.1-15; EP: 1 Samuel 17.55—18.16, Luke 8.16-25
proper-11-tue: MP: 1 Samuel 19.1-18, Luke 8.26-39; EP: 1 Samuel 20.1-17, Luke 8.40-56
proper-11-wed: MP: 1 Samuel 20.18-42, Luke 9.1-17; EP: 1 Samuel 21.1—22.5, Luke 9.18-27
proper-11-thu: MP: 1 Samuel 22.6-23, Luke 9.28-36; EP: 1 Samuel 23, Luke 9.37-50
proper-11-fri: MP: 1 Samuel 24, Luke 9.51-62; EP: 1 Samuel 25.1-31, Luke 10.1-16
proper-11-sat: MP: 1 Samuel 25.32-44, Luke 10.17-24; EP: 1 Samuel 26, Luke 10.25-37
proper-12-mon: MP: 1 Samuel 28.3-25, Luke 10.38-42; EP: 1 Samuel 31, Luke 11.1-13
proper-12-tue: MP: 2 Samuel 1, Luke 11.14-28; EP: 2 Samuel 2.1-11, Luke 11.29-36
proper-12-wed: MP: 2 Samuel 3.6-21, Luke 11.37-54; EP: 2 Samuel 3.22-39, Luke 12.1-12
proper-12-thu: MP: 2 Samuel 5.1-12, Luke 12.13-34; EP: 2 Samuel 5.17—6.12a, Luke 12.35-48
proper-12-fri: MP: 2 Samuel 6.12b-23, Luke 12.49-59; EP: 2 Samuel 7.1-17, Luke 13.1-9
proper-12-sat: MP: 2 Samuel 7.18-29, Luke 13.10-21; EP: 2 Samuel 9, Luke 13.22-35
proper-13-mon: MP: 2 Samuel 11, Luke 14.1-14; EP: 2 Samuel 12.1-25, Luke 14.15-24
proper-13-tue: MP: 2 Samuel 13.1-22, Luke 14.25-35; EP: 2 Samuel 13.23-39, Luke 15.1-10
proper-13-wed: MP: 2 Samuel 14.1-24, Luke 15.11-32; EP: 2 Samuel 15.1-12, Luke 16.1-18
proper-13-thu: MP: 2 Samuel 15.13-29, Luke 16.19-31; EP: 2 Samuel 15.30—16.4, Luke 17.1-10
proper-13-fri: MP: 2 Samuel 16.5-23, Luke 17.11-19; EP: 2 Samuel 17.1-23, Luke 17.20-37
proper-13-sat: MP: 2 Samuel 18.1-18, Luke 18.1-14; EP: 2 Samuel 18.19-33, Luke 18.15-30
proper-14-mon: MP: 2 Samuel 19.1-18, Luke 18.31-43; EP: 2 Samuel 19.19-39, Luke 19.1-10
proper-14-tue: MP: 2 Samuel 19.40—20.13, Luke 19.11-27; EP: 2 Samuel 23.1-7, Luke 19.28-40
proper-14-wed: MP: 2 Samuel 24.1-17, Luke 19.41-48; EP: 2 Samuel 24.18-25, Luke 20.1-8
proper-14-thu: MP: 1 Kings 1.1-31, Luke 20.9-19; EP: 1 Kings 1.32-53, Luke 20.20-40
proper-14-fri: MP: 1 Kings 2.1-12, Luke 20.41—21.4; EP: 1 Kings 3.1-15, Luke 21.5-24
proper-14-sat: MP: 1 Kings 3.16-28, Luke 21.25-38; EP: 1 Kings 4.29-34, Luke 22.1-13
proper-15-mon: MP: 1 Kings 5, Luke 22.14-23; EP: 1 Kings 6.1-14, Luke 22.24-38
proper-15-tue: MP: 1 Kings 6.23-38, Luke 22.39-53; EP: 1 Kings 8.1-21, Luke 22.54-71
proper-15-wed: MP: 1 Kings 8.22-53, Luke 23.1-25; EP: 1 Kings 8.54-66, Luke 23.26-43
proper-15-thu: MP: 1 Kings 10.1-13, Luke 23.44-56a; EP: 1 Kings 11.1-13, Luke 23.56b—24.12
proper-15-fri: MP: 1 Kings 11.26-40, Luke 24.13-35; EP: 1 Kings 12.1-24, Luke 24.36-53
proper-15-sat: MP: 1 Kings 12.25-33, John 1.1-18; EP: 1 Kings 13.1-10, John 1.19-34
proper-16-mon: MP: 1 Kings 13.11-34, John 1.35-51; EP: 1 Kings 14.1-20, John 2.1-12
proper-16-tue: MP: 1 Kings 16.23-34, John 2.13-25; EP: 1 Kings 17.1-16, John 3.1-13
proper-16-wed: MP: 1 Kings 17.17-24, John 3.14-21; EP: 1 Kings 18.1-20, John 3.22-36
proper-16-thu: MP: 1 Kings 18.21-40, John 4.1-14; EP: 1 Kings 19.1-18, John 4.15-26
proper-16-fri: MP: 1 Kings 19.19-21; 20.1-22, John 4.27-42; EP: 1 Kings 20.23-43, John 4.43-54
proper-16-sat: MP: 1 Kings 21, John 5.1-18; EP: 1 Kings 22.1-28, John 5.19-29
proper-17-mon: MP: 1 Kings 22.29-45, John 5.30-47; EP: 2 Kings 1, John 6.1-15
proper-17-tue: MP: 2 Kings 2.1-18, John 6.16-27; EP: 2 Kings 4.1-37, John 6.28-40
proper-17-wed: MP: 2 Kings 5, John 6.41-51; EP: 2 Kings 6.1-23, John 6.52-59
proper-17-thu: MP: 2 Kings 6.24—7.2, John 6.60-71; EP: 2 Kings 7.3-20, John 7.1-13
proper-17-fri: MP: 2 Kings 9.1-16, John 7.14-24; EP: 2 Kings 9.17-37, John 7.25-36
proper-17-sat: MP: 2 Kings 11.1-20, John 7.37-52; EP: 2 Kings 12.1-19, John 7.53—8.11
proper-18-mon: MP: 2 Kings 17.1-23, John 8.12-30; EP: 2 Kings 17.24-41, John 8.31-47
proper-18-tue: MP: 2 Kings 18.1-12, John 8.48-59; EP: 2 Kings 18.13-37, John 9.1-17
proper-18-wed: MP: 2 Kings 19.1-19, John 9.18-41; EP: 2 Kings 19.20-37, John 10.1-10
proper-18-thu: MP: 2 Kings 20, John 10.11-21; EP: 2 Kings 21.1-18, John 10.22-42
proper-18-fri: MP: 2 Kings 22, John 11.1-16; EP: 2 Kings 23.1-25, John 11.17-27
proper-18-sat: MP: 2 Kings 23.36—24.7, John 11.28-44; EP: 2 Kings 24.8-17, John 11.45-57
proper-19-mon: MP: 2 Kings 24.18—25.12, John 12.1-11; EP: 2 Kings 25.22-30, John 12.12-19
proper-19-tue: MP: Ezekiel 2.1—3.4, John 12.20-36a; EP: Ezekiel 3.4-21, John 12.36b-50
proper-19-wed: MP: Ezekiel 8, John 13.1-11; EP: Ezekiel 10.1-19, John 13.12-30
proper-19-thu: MP: Ezekiel 11.14-25, John 13.31-38; EP: Ezekiel 12.1-16, John 14.1-14
proper-19-fri: MP: Ezekiel 12.17-28, John 14.15-31; EP: Ezekiel 13.1-16, John 15.1-11
proper-19-sat: MP: Ezekiel 14.1-11, John 15.12-27; EP: Ezekiel 14.12-23, John 16.1-15
proper-20-mon: MP: Ezekiel 16.1-34, John 16.16-33; EP: Ezekiel 16.35-52, John 17.1-5
proper-20-tue: MP: Ezekiel 16.53-63, John 17.6-19; EP: Ezekiel 17, John 17.20-26
proper-20-wed: MP: Ezekiel 18.1-20, John 18.1-11; EP: Ezekiel 18.21-32, John 18.12-27
proper-20-thu: MP: Ezekiel 20.1-20, John 18.28-40; EP: Ezekiel 20.21-38, John 19.1-16
proper-20-fri: MP: Ezekiel 24.1-14, John 19.17-30; EP: Ezekiel 24.15-27, John 19.31-42
proper-20-sat: MP: Ezekiel 28.1-19, John 20.1-10; EP: Ezekiel 33.1-20, John 20.11-18
proper-21-mon: MP: Ezekiel 33.21-33, John 20.19-31; EP: Ezekiel 34.1-16, John 21.1-14
proper-21-tue: MP: Ezekiel 34.17-31, John 21.15-25; EP: Ezekiel 36.16-36, Romans 1.1-17
proper-21-wed: MP: Ezekiel 37.1-14, Romans 1.18-32; EP: Ezekiel 37.15-28, Romans 2.1-16
proper-21-thu: MP: Ezekiel 39.21-29, Romans 2.17-29; EP: Ezekiel 40.1-4; 43.1-12, Romans 3.1-20
proper-21-fri: MP: Ezekiel 47.1-12, Romans 3.21-31; EP: Daniel 1, Romans 4.1-12
proper-21-sat: MP: Daniel 2.1-24, Romans 4.13-25; EP: Daniel 2.25-49, Romans 5.1-11
proper-22-mon: MP: Daniel 3.1-18, Romans 5.12-21; EP: Daniel 3.19-30, Romans 6.1-14
proper-22-tue: MP: Daniel 4.1-18, Romans 6.15-23; EP: Daniel 4.19-37, Romans 7.1-12
proper-22-wed: MP: Daniel 5.1-12, Romans 7.13-25; EP: Daniel 5.13-30, Romans 8.1-11
proper-22-thu: MP: Daniel 6.1-12, Romans 8.12-17; EP: Daniel 6.13-28, Romans 8.18-30
proper-22-fri: MP: Daniel 7.1-14, Romans 8.31-39; EP: Daniel 7.15-28, Romans 9.1-18
proper-22-sat: MP: Daniel 8.1-14, Romans 9.19-29; EP: Daniel 8.15-27, Romans 9.30—10.4
proper-23-mon: MP: Daniel 9.1-19, Romans 10.5-21; EP: Daniel 9.20-27, Romans 11.1-12
proper-23-tue: MP: Daniel 10.1—11.1, Romans 11.13-24; EP: Daniel 11.2-19, Romans 11.25-36
proper-23-wed: MP: Daniel 11.20-39, Romans 12; EP: Daniel 11.40—12.4, Romans 13.1-7
proper-23-thu: MP: Daniel 12.5-13, Romans 13.8-14; EP: Joel 1.1-14, Romans 14.1-12
proper-23-fri: MP: Joel 1.15—2.11, Romans 14.13-23; EP: Joel 2.12-27, Romans 15.1-13
proper-23-sat: MP: Joel 2.28—3.3, Romans 15.14-21; EP: Joel 3.9-21, Romans 15.22-33
proper-24-mon: MP: Amos 1, Romans 16; EP: Amos 2, James 1.1-11
proper-24-tue: MP: Amos 3, James 1.12-27; EP: Amos 4, James 2.1-13
proper-24-wed: MP: Amos 5.1-17, James 2.14-26; EP: Amos 5.18-27, James 3
proper-24-thu: MP: Amos 6, James 4.1-12; EP: Amos 7, James 4.13—5.6
proper-24-fri: MP: Amos 8, James 5.7-20; EP: Amos 9, 1 Peter 1.1-12
proper-24-sat: MP: Obadiah, 1 Peter 1.13-25; EP: Jonah 1, 1 Peter 2.1-10
proper-25-mon: MP: Jonah 2, 1 Peter 2.11-25; EP: Jonah 3, 1 Peter 3.1-12
proper-25-tue: MP: Jonah 4, 1 Peter 3.13—4.6; EP: Micah 1, 1 Peter 4.7-19
proper-25-wed: MP: Micah 2, 1 Peter 5; EP: Micah 3, 2 Peter 1.1-11
proper-25-thu: MP: Micah 4.1—5.1, 2 Peter 1.12-21; EP: Micah 5.2-15, 2 Peter 2
proper-25-fri: MP: Micah 6, 2 Peter 3; EP: Micah 7, Jude
proper-25-sat: MP: Nahum 1, Revelation 1; EP: Nahum 2, Revelation 2.1-17
kingdom-4-mon: MP: Nahum 3, Revelation 2.18—3.6; EP: Habakkuk 1, Revelation 3.7-22
kingdom-4-tue: MP: Habakkuk 2, Revelation 4; EP: Habakkuk 3, Revelation 5
kingdom-4-wed: MP: Zephaniah 1, Revelation 6; EP: Zephaniah 2, Revelation 7
kingdom-4-thu: MP: Zephaniah 3, Revelation 8; EP: Haggai 1, Revelation 9
kingdom-4-fri: MP: Haggai 2, Revelation 10; EP: Zechariah 1.1-17, Revelation 11
kingdom-4-sat: MP: Zechariah 1.18—2.13, Revelation 12; EP: Zechariah 3, Revelation 13
kingdom-3-mon: MP: Zechariah 4, Revelation 14.1-13; EP: Zechariah 5, Revelation 14.14—15.8
kingdom-3-tue: MP: Zechariah 6.1-15, Revelation 16; EP: Zechariah 7, Revelation 17
kingdom-3-wed: MP: Zechariah 8.1-8, Revelation 18; EP: Zechariah 8.9-23, Revelation 19
kingdom-3-thu: MP: Zechariah 9, Revelation 20; EP: Zechariah 10, Revelation 21.1-8
kingdom-3-fri: MP: Zechariah 11, Revelation 21.9-21; EP: Zechariah 12, Revelation 21.22—22.5
kingdom-3-sat: MP: Zechariah 13, Revelation 22.6-21; EP: Zechariah 14, Malachi 1
kingdom-2-mon: MP: Malachi 2.1-16, 1 John 1; EP: Malachi 2.17—3.12, 1 John 2.1-17
kingdom-2-tue: MP: Malachi 3.13—4.6, 1 John 2.18-29; EP: Isaiah 40.1-11, 1 John 3.1-10
kingdom-2-wed: MP: Isaiah 40.12-26, 1 John 3.11—4.6; EP: Isaiah 40.27—41.7, 1 John 4.7-21
kingdom-2-thu: MP: Isaiah 41.8-20, 1 John 5; EP: Isaiah 41.21—42.9, 2 John
kingdom-2-fri: MP: Isaiah 42.10-25, 3 John; EP: Isaiah 43.1-13, Jude
kingdom-2-sat: MP: Isaiah 43.14—44.5, Revelation 1; EP: Isaiah 44.6-23, Revelation 2.1-11
"""

def main():
    entries = []
    for line in DATA.strip().split('\n'):
        line = line.strip()
        if not line or line.startswith('#'):
            continue
        parsed = parse_day_line(line)
        entries.extend(parsed)

    output_path = os.path.join(os.path.dirname(__file__), 'data', 'lectionary-readings-cw-office.json')
    with open(output_path, 'w') as f:
        json.dump(entries, f, indent=2)

    print(f'Generated {len(entries)} CW office readings')
    print(f'Output: {output_path}')

    # Verify
    contexts = {}
    for e in entries:
        ctx = e['serviceContext']
        contexts[ctx] = contexts.get(ctx, 0) + 1
    for ctx, count in sorted(contexts.items()):
        print(f'  {ctx}: {count}')

    slugs = set(e['occasionSlug'] for e in entries)
    print(f'  Unique occasion slugs: {len(slugs)}')


if __name__ == '__main__':
    main()
