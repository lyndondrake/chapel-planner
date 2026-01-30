#!/usr/bin/env python3
"""Generate BCP (1662) daily office lectionary readings (Morning Prayer & Evening Prayer).

The BCP daily office follows a one-year cycle based on the calendar year,
mapped here to liturgical occasion slugs. Each day has OT + NT for both MP and EP.
"""

import json
import re
import os

def parse_reference(ref):
    """Parse a biblical reference into book, chapter, verseStart, verseEnd."""
    ref = ref.strip()

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

    # Cross-chapter span
    m = re.match(r'^(.+?)\s+(\d+)\.(\d+)\s*[—–]\s*(\d+)\.(\d+\w?)$', ref)
    if m:
        return m.group(1), m.group(2), m.group(3), None

    # Semicolon-separated refs
    m = re.match(r'^(.+?)\s+(\d+)\.(\d+)', ref)
    if m and ';' in ref:
        return m.group(1), m.group(2), m.group(3), None

    # Standard chapter.verse-verse
    m = re.match(r'^(.+?)\s+(\d+)\.(\d+)\s*-\s*(\d+\w?)$', ref)
    if m:
        return m.group(1), m.group(2), m.group(3), m.group(4)

    # Complex verse range
    m = re.match(r'^(.+?)\s+(\d+)\.(.+)$', ref)
    if m:
        verses = m.group(3)
        first = re.match(r'(\d+)', verses)
        numbers = re.findall(r'(\d+)', verses)
        vs = first.group(1) if first else None
        ve = numbers[-1] if len(numbers) > 1 else None
        return m.group(1), m.group(2), vs, ve

    # Whole chapter
    m = re.match(r'^(.+?)\s+(\d+)$', ref)
    if m:
        return m.group(1), m.group(2), None, None

    return ref, None, None, None


def make_entry(slug, context, reading_type, reference, sort_order):
    book, chapter, vs, ve = parse_reference(reference)
    return {
        "occasionSlug": slug,
        "tradition": "bcp",
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
    entries = []
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


DATA = """
advent-1-mon: MP: Isaiah 1.1-20, Matthew 1; EP: Isaiah 1.21-31, Romans 1
advent-1-tue: MP: Isaiah 2, Matthew 2; EP: Isaiah 3, Romans 2
advent-1-wed: MP: Isaiah 4, Matthew 3; EP: Isaiah 5.1-17, Romans 3
advent-1-thu: MP: Isaiah 5.18-30, Matthew 4; EP: Isaiah 6, Romans 4
advent-1-fri: MP: Isaiah 7, Matthew 5.1-26; EP: Isaiah 8, Romans 5
advent-1-sat: MP: Isaiah 9.1-7, Matthew 5.27-48; EP: Isaiah 9.8-21, Romans 6
advent-2-mon: MP: Isaiah 10.1-19, Matthew 6.1-18; EP: Isaiah 10.20-34, Romans 7
advent-2-tue: MP: Isaiah 11, Matthew 6.19-34; EP: Isaiah 12, Romans 8.1-17
advent-2-wed: MP: Isaiah 13, Matthew 7; EP: Isaiah 14.1-23, Romans 8.18-39
advent-2-thu: MP: Isaiah 14.24-32, Matthew 8.1-17; EP: Isaiah 17, Romans 9.1-18
advent-2-fri: MP: Isaiah 19, Matthew 8.18-34; EP: Isaiah 21.1-12, Romans 9.19-33
advent-2-sat: MP: Isaiah 22.1-14, Matthew 9.1-17; EP: Isaiah 22.15-25, Romans 10
advent-3-mon: MP: Isaiah 24, Matthew 9.18-38; EP: Isaiah 25, Romans 11.1-24
advent-3-tue: MP: Isaiah 26.1-13, Matthew 10.1-23; EP: Isaiah 26.14—27.1, Romans 11.25-36
advent-3-wed: MP: Isaiah 27.2-13, Matthew 10.24-42; EP: Isaiah 28.1-13, Romans 12
advent-3-thu: MP: Isaiah 28.14-29, Matthew 11; EP: Isaiah 29.1-14, Romans 13
advent-3-fri: MP: Isaiah 29.15-24, Matthew 12.1-21; EP: Isaiah 30.1-18, Romans 14
advent-3-sat: MP: Isaiah 30.19-33, Matthew 12.22-45; EP: Isaiah 31, Romans 15.1-13
advent-4-mon: MP: Isaiah 32, Matthew 12.46—13.17; EP: Isaiah 33, Romans 15.14-33
advent-4-tue: MP: Isaiah 34, Matthew 13.18-35; EP: Isaiah 35, Romans 16
advent-4-wed: MP: Isaiah 36, Matthew 13.36-58; EP: Isaiah 37.1-20, 1 Corinthians 1
advent-4-thu: MP: Isaiah 37.21-38, Matthew 14; EP: Isaiah 38, 1 Corinthians 2
advent-4-fri: MP: Isaiah 39, Matthew 15.1-28; EP: Isaiah 40.1-11, 1 Corinthians 3
advent-4-sat: MP: Isaiah 40.12-31, Matthew 15.29—16.12; EP: Isaiah 41.1-20, 1 Corinthians 4
christmas-dec-26: MP: Genesis 4.1-10, Acts 6; EP: 2 Chronicles 24.20-22, Acts 7.54-60
christmas-dec-27: MP: Exodus 33.7-11a, 1 John 1; EP: Isaiah 6.1-8, Revelation 1.1-8
christmas-dec-28: MP: Jeremiah 31.1-17, Matthew 18.1-10; EP: Baruch 4.21-27, Matthew 2.13-18
christmas-dec-29: MP: Isaiah 41.21—42.9, 1 John 2.1-14; EP: Isaiah 42.10-25, 1 John 2.15-29
christmas-dec-30: MP: Isaiah 43.1-13, 1 John 3.1-10; EP: Isaiah 43.14—44.5, 1 John 3.11—4.6
christmas-dec-31: MP: Isaiah 44.6-23, 1 John 4.7-21; EP: Isaiah 45.1-13, 1 John 5
christmas-jan-1: MP: Genesis 17.1-13, Romans 2.17-29; EP: Deuteronomy 10.12-22, Colossians 2.8-15
epiphany-1-mon: MP: Isaiah 45.14-25, Ephesians 1; EP: Isaiah 46, Ephesians 2
epiphany-1-tue: MP: Isaiah 47, Ephesians 3; EP: Isaiah 48, Ephesians 4.1-16
epiphany-1-wed: MP: Isaiah 49.1-13, Ephesians 4.17-32; EP: Isaiah 49.14-26, Ephesians 5.1-21
epiphany-1-thu: MP: Isaiah 50, Ephesians 5.22—6.9; EP: Isaiah 51.1-8, Ephesians 6.10-24
epiphany-1-fri: MP: Isaiah 51.9-23, Philippians 1; EP: Isaiah 52.1-12, Philippians 2.1-13
epiphany-1-sat: MP: Isaiah 52.13—53.12, Philippians 2.14-30; EP: Isaiah 54, Philippians 3
epiphany-2-mon: MP: Isaiah 55, Philippians 4; EP: Isaiah 56, Colossians 1.1-20
epiphany-2-tue: MP: Isaiah 57, Colossians 1.21—2.7; EP: Isaiah 58, Colossians 2.8-23
epiphany-2-wed: MP: Isaiah 59, Colossians 3.1-17; EP: Isaiah 60, Colossians 3.18—4.6
epiphany-2-thu: MP: Isaiah 61, Colossians 4.7-18; EP: Isaiah 62, 1 Thessalonians 1
epiphany-2-fri: MP: Isaiah 63.1-6, 1 Thessalonians 2.1-16; EP: Isaiah 63.7—64.5, 1 Thessalonians 2.17—3.13
epiphany-2-sat: MP: Isaiah 64.6—65.7, 1 Thessalonians 4; EP: Isaiah 65.8-25, 1 Thessalonians 5
epiphany-3-mon: MP: Isaiah 66, 2 Thessalonians 1; EP: Jeremiah 1, 2 Thessalonians 2
epiphany-3-tue: MP: Jeremiah 2.1-19, 2 Thessalonians 3; EP: Jeremiah 2.20-37, 1 Timothy 1
epiphany-3-wed: MP: Jeremiah 3.1-18, 1 Timothy 2; EP: Jeremiah 4.1-18, 1 Timothy 3
epiphany-3-thu: MP: Jeremiah 4.19-31, 1 Timothy 4; EP: Jeremiah 5.1-19, 1 Timothy 5
epiphany-3-fri: MP: Jeremiah 5.20-31, 1 Timothy 6; EP: Jeremiah 6.1-21, 2 Timothy 1
epiphany-3-sat: MP: Jeremiah 6.22-30, 2 Timothy 2; EP: Jeremiah 7.1-20, 2 Timothy 3
epiphany-4-mon: MP: Jeremiah 7.21—8.3, 2 Timothy 4; EP: Jeremiah 8.4-22, Titus 1
epiphany-4-tue: MP: Jeremiah 9.1-16, Titus 2; EP: Jeremiah 9.17-26, Titus 3
epiphany-4-wed: MP: Jeremiah 10.1-16, Philemon; EP: Jeremiah 10.17-25, Hebrews 1
epiphany-4-thu: MP: Jeremiah 11.1-17, Hebrews 2; EP: Jeremiah 11.18—12.6, Hebrews 3
epiphany-4-fri: MP: Jeremiah 12.7-17, Hebrews 4.1-13; EP: Jeremiah 13.1-14, Hebrews 4.14—5.10
epiphany-4-sat: MP: Jeremiah 13.15-27, Hebrews 5.11—6.12; EP: Jeremiah 14.1-16, Hebrews 6.13-20
before-lent-2-mon: MP: Jeremiah 15.1-14, Hebrews 7; EP: Jeremiah 15.15-21, Hebrews 8
before-lent-2-tue: MP: Jeremiah 16.1-13, Hebrews 9.1-14; EP: Jeremiah 16.14-21, Hebrews 9.15-28
before-lent-2-wed: MP: Jeremiah 17.1-18, Hebrews 10.1-18; EP: Jeremiah 17.19-27, Hebrews 10.19-39
before-lent-2-thu: MP: Jeremiah 18.1-12, Hebrews 11.1-16; EP: Jeremiah 18.13-23, Hebrews 11.17-31
before-lent-2-fri: MP: Jeremiah 19, Hebrews 11.32-40; EP: Jeremiah 20, Hebrews 12.1-13
before-lent-2-sat: MP: Jeremiah 21, Hebrews 12.14-29; EP: Jeremiah 22.1-19, Hebrews 13
before-lent-1-mon: MP: Jeremiah 22.20-30, James 1; EP: Jeremiah 23.1-8, James 2
before-lent-1-tue: MP: Jeremiah 23.9-32, James 3; EP: Jeremiah 24, James 4
before-lent-1-wed: MP: Jeremiah 25.1-14, James 5; EP: Jeremiah 25.15-38, 1 Peter 1.1-12
before-lent-1-thu: MP: Jeremiah 26, 1 Peter 1.13—2.3; EP: Jeremiah 27, 1 Peter 2.4-17
before-lent-1-fri: MP: Jeremiah 28, 1 Peter 2.18—3.7; EP: Jeremiah 29.1-14, 1 Peter 3.8-22
before-lent-1-sat: MP: Jeremiah 29.15-32, 1 Peter 4; EP: Jeremiah 30.1-11, 1 Peter 5
lent-1-mon: MP: Jeremiah 30.12-22, John 1.1-18; EP: Jeremiah 31.1-14, John 1.19-34
lent-1-tue: MP: Jeremiah 31.15-26, John 1.35-51; EP: Jeremiah 31.27-37, John 2
lent-1-wed: MP: Jeremiah 32.1-15, John 3.1-21; EP: Jeremiah 32.16-44, John 3.22-36
lent-1-thu: MP: Jeremiah 33.1-13, John 4.1-26; EP: Jeremiah 33.14-26, John 4.27-42
lent-1-fri: MP: Jeremiah 34, John 4.43-54; EP: Jeremiah 35, John 5.1-18
lent-1-sat: MP: Jeremiah 36.1-19, John 5.19-29; EP: Jeremiah 36.20-32, John 5.30-47
lent-2-mon: MP: Jeremiah 37, John 6.1-21; EP: Jeremiah 38.1-13, John 6.22-40
lent-2-tue: MP: Jeremiah 38.14-28, John 6.41-58; EP: Jeremiah 39, John 6.59-71
lent-2-wed: MP: Jeremiah 40, John 7.1-24; EP: Jeremiah 41, John 7.25-52
lent-2-thu: MP: Jeremiah 42, John 8.1-30; EP: Jeremiah 43, John 8.31-47
lent-2-fri: MP: Jeremiah 44.1-14, John 8.48-59; EP: Jeremiah 44.15-30, John 9
lent-2-sat: MP: Jeremiah 46, John 10.1-21; EP: Jeremiah 47, John 10.22-42
lent-3-mon: MP: Jeremiah 48.1-20, John 11.1-27; EP: Jeremiah 48.21-47, John 11.28-44
lent-3-tue: MP: Jeremiah 49.1-22, John 11.45-57; EP: Jeremiah 49.23-39, John 12.1-19
lent-3-wed: MP: Jeremiah 50.1-20, John 12.20-36; EP: Jeremiah 50.21-46, John 12.37-50
lent-3-thu: MP: Jeremiah 51.1-19, John 13.1-20; EP: Jeremiah 51.20-44, John 13.21-38
lent-3-fri: MP: Jeremiah 51.45-64, John 14.1-14; EP: Jeremiah 52.1-11, John 14.15-31
lent-3-sat: MP: Jeremiah 52.12-34, John 15.1-17; EP: Lamentations 1.1-12, John 15.18-27
lent-4-mon: MP: Lamentations 1.13-22, John 16.1-15; EP: Lamentations 2.1-13, John 16.16-33
lent-4-tue: MP: Lamentations 2.14-22, John 17.1-5; EP: Lamentations 3.1-30, John 17.6-19
lent-4-wed: MP: Lamentations 3.31-51, John 17.20-26; EP: Lamentations 3.52-66, John 18.1-11
lent-4-thu: MP: Lamentations 4.1-12, John 18.12-27; EP: Lamentations 4.13-22, John 18.28-40
lent-4-fri: MP: Lamentations 5, John 19.1-16; EP: Ezekiel 1.1-14, John 19.17-30
lent-4-sat: MP: Ezekiel 1.15—2.2, John 19.31-42; EP: Ezekiel 2.3—3.11, John 20.1-18
lent-5-mon: MP: Ezekiel 3.12-27, John 20.19-31; EP: Ezekiel 4, John 21.1-14
lent-5-tue: MP: Ezekiel 5, John 21.15-25; EP: Ezekiel 6, Luke 1.1-25
lent-5-wed: MP: Ezekiel 7, Luke 1.26-45; EP: Ezekiel 8, Luke 1.46-66
lent-5-thu: MP: Ezekiel 9, Luke 1.67-80; EP: Ezekiel 10, Luke 2.1-20
lent-5-fri: MP: Ezekiel 11.1-13, Luke 2.21-40; EP: Ezekiel 11.14-25, Luke 2.41-52
lent-5-sat: MP: Ezekiel 12.1-16, Luke 3.1-22; EP: Ezekiel 12.17-28, Luke 3.23-38
easter-2-mon: MP: Exodus 12.1-14, Revelation 1; EP: Exodus 12.14-36, Revelation 2.1-17
easter-2-tue: MP: Exodus 12.37-51, Revelation 2.18-29; EP: Exodus 13.1-16, Revelation 3.1-13
easter-2-wed: MP: Exodus 13.17—14.14, Revelation 3.14-22; EP: Exodus 14.15-31, Revelation 4
easter-2-thu: MP: Exodus 15.1-21, Revelation 5; EP: Exodus 15.22—16.10, Revelation 6
easter-2-fri: MP: Exodus 16.11-36, Revelation 7; EP: Exodus 17, Revelation 8
easter-2-sat: MP: Exodus 18, Revelation 9; EP: Exodus 19, Revelation 10
easter-3-mon: MP: Exodus 20, Revelation 11; EP: Exodus 21.1-21, Revelation 12
easter-3-tue: MP: Exodus 22.1-20, Revelation 13; EP: Exodus 22.21—23.9, Revelation 14
easter-3-wed: MP: Exodus 23.10-33, Revelation 15; EP: Exodus 24, Revelation 16
easter-3-thu: MP: Exodus 25.1-22, Revelation 17; EP: Exodus 28.1-5,29-43, Revelation 18
easter-3-fri: MP: Exodus 29.1-9, Revelation 19; EP: Exodus 29.38—30.16, Revelation 20
easter-3-sat: MP: Exodus 32.1-14, Revelation 21.1-14; EP: Exodus 32.15-34, Revelation 21.15-27
easter-4-mon: MP: Exodus 33, Revelation 22; EP: Exodus 34.1-16, Acts 1
easter-4-tue: MP: Exodus 34.17-35, Acts 2.1-21; EP: Exodus 35.1—36.7, Acts 2.22-47
easter-4-wed: MP: Exodus 40.17-38, Acts 3; EP: Leviticus 8.1-13,30-36, Acts 4.1-22
easter-4-thu: MP: Leviticus 9, Acts 4.23-37; EP: Leviticus 16.2-24, Acts 5.1-16
easter-4-fri: MP: Leviticus 17, Acts 5.17-42; EP: Leviticus 19.1-18,30-37, Acts 6
easter-4-sat: MP: Leviticus 23.1-22, Acts 7.1-29; EP: Leviticus 23.23-44, Acts 7.30-53
easter-5-mon: MP: Leviticus 25.1-24, Acts 7.54—8.3; EP: Leviticus 25.25-55, Acts 8.4-25
easter-5-tue: MP: Leviticus 26.1-20, Acts 8.26-40; EP: Leviticus 26.21-39, Acts 9.1-22
easter-5-wed: MP: Numbers 6.1-21, Acts 9.23-43; EP: Numbers 8.5-22, Acts 10.1-23
easter-5-thu: MP: Numbers 9.15-23; 10.33-36, Acts 10.24-48; EP: Numbers 11.1-33, Acts 11.1-18
easter-5-fri: MP: Numbers 12, Acts 11.19-30; EP: Numbers 13.1-3,17-33, Acts 12.1-17
easter-5-sat: MP: Numbers 14.1-25, Acts 12.18-25; EP: Numbers 14.26-45, Acts 13.1-12
easter-6-mon: MP: Numbers 16.1-35, Acts 13.13-41; EP: Numbers 16.36-50, Acts 13.42—14.7
easter-6-tue: MP: Numbers 17.1-11, Acts 14.8-28; EP: Numbers 20.1-13, Acts 15.1-21
easter-6-wed: MP: Numbers 21.4-9, Acts 15.22-35; EP: Numbers 22.1-35, Acts 15.36—16.5
easter-6-thu: MP: Numbers 22.36—23.12, Acts 16.6-24; EP: Numbers 23.13-26, Acts 16.25-40
easter-6-fri: MP: Numbers 24, Acts 17.1-15; EP: Numbers 25, Acts 17.16-34
easter-6-sat: MP: Numbers 27.12-23, Acts 18.1-21; EP: Deuteronomy 3.23-29, Acts 18.22—19.7
easter-7-mon: MP: Deuteronomy 4.1-14, Acts 19.8-20; EP: Deuteronomy 4.15-31, Acts 19.21-41
easter-7-tue: MP: Deuteronomy 4.32-40, Acts 20.1-16; EP: Deuteronomy 5.1-22, Acts 20.17-38
easter-7-wed: MP: Deuteronomy 5.22-33, Acts 21.1-16; EP: Deuteronomy 6, Acts 21.17-36
easter-7-thu: MP: Deuteronomy 7.1-11, Acts 21.37—22.21; EP: Deuteronomy 7.12-26, Acts 22.22—23.11
easter-7-fri: MP: Deuteronomy 8, Acts 23.12-35; EP: Deuteronomy 9.1-10, Acts 24.1-23
easter-7-sat: MP: Deuteronomy 9.11-24, Acts 24.24—25.12; EP: Deuteronomy 10.1-11, Acts 25.13-27
proper-4-mon: MP: Deuteronomy 10.12-22, Acts 26.1-23; EP: Deuteronomy 11.1-12, Acts 26.24—27.8
proper-4-tue: MP: Deuteronomy 11.13-28, Acts 27.9-26; EP: Deuteronomy 12.1-14, Acts 27.27-44
proper-4-wed: MP: Deuteronomy 15.1-18, Acts 28.1-16; EP: Deuteronomy 16.1-20, Acts 28.17-31
proper-4-thu: MP: Deuteronomy 17.8-20, Mark 1.1-13; EP: Deuteronomy 18.9-22, Mark 1.14-28
proper-4-fri: MP: Deuteronomy 19.1-13, Mark 1.29-45; EP: Deuteronomy 21.22—22.8, Mark 2.1-12
proper-4-sat: MP: Deuteronomy 24.5-22, Mark 2.13-22; EP: Deuteronomy 26.1-11, Mark 2.23—3.6
proper-5-mon: MP: Deuteronomy 28.1-14, Mark 3.7-19; EP: Deuteronomy 28.15-29, Mark 3.20-35
proper-5-tue: MP: Deuteronomy 28.58-68, Mark 4.1-20; EP: Deuteronomy 29.2-15, Mark 4.21-34
proper-5-wed: MP: Deuteronomy 30, Mark 4.35-41; EP: Deuteronomy 31.1-13, Mark 5.1-20
proper-5-thu: MP: Deuteronomy 31.14-29, Mark 5.21-34; EP: Deuteronomy 32.1-14, Mark 5.35-43
proper-5-fri: MP: Deuteronomy 32.15-47, Mark 6.1-13; EP: Deuteronomy 33.1-12, Mark 6.14-29
proper-5-sat: MP: Deuteronomy 33.13-29, Mark 6.30-44; EP: Deuteronomy 34, Mark 6.45-56
proper-6-mon: MP: Joshua 1, Mark 7.1-13; EP: Joshua 2, Mark 7.14-23
proper-6-tue: MP: Joshua 3, Mark 7.24-37; EP: Joshua 4.1—5.1, Mark 8.1-13
proper-6-wed: MP: Joshua 5.2-15, Mark 8.14-26; EP: Joshua 6.1-20, Mark 8.27-38
proper-6-thu: MP: Joshua 7.1-15, Mark 9.1-13; EP: Joshua 7.16-26, Mark 9.14-29
proper-6-fri: MP: Joshua 8.1-29, Mark 9.30-37; EP: Joshua 9.3-27, Mark 9.38-50
proper-6-sat: MP: Joshua 10.1-15, Mark 10.1-16; EP: Joshua 14.6-15, Mark 10.17-31
proper-7-mon: MP: Joshua 21.43—22.8, Mark 10.32-45; EP: Joshua 22.9-31, Mark 10.46-52
proper-7-tue: MP: Joshua 23, Mark 11.1-11; EP: Joshua 24.1-28, Mark 11.12-26
proper-7-wed: MP: Joshua 24.29-33, Mark 11.27-33; EP: Judges 2.6-23, Mark 12.1-12
proper-7-thu: MP: Judges 4.1-23, Mark 12.13-27; EP: Judges 5.1-12, Mark 12.28-34
proper-7-fri: MP: Judges 6.1-24, Mark 12.35-44; EP: Judges 6.25-40, Mark 13.1-13
proper-7-sat: MP: Judges 7.1-23, Mark 13.14-27; EP: Judges 8.22-35, Mark 13.28-37
proper-8-mon: MP: Judges 9.1-6,22-25, Mark 14.1-11; EP: Judges 10.6—11.11, Mark 14.12-26
proper-8-tue: MP: Judges 11.29-40, Mark 14.27-42; EP: Judges 12.1-7, Mark 14.43-52
proper-8-wed: MP: Judges 13.1-24, Mark 14.53-65; EP: Judges 14, Mark 14.66-72
proper-8-thu: MP: Judges 15.1-16, Mark 15.1-15; EP: Judges 16.1-14, Mark 15.16-32
proper-8-fri: MP: Judges 16.15-31, Mark 15.33-47; EP: Ruth 1, Mark 16
proper-8-sat: MP: Ruth 2, Luke 1.1-25; EP: Ruth 3, Luke 1.26-38
proper-9-mon: MP: Ruth 4.1-17, Luke 1.39-56; EP: 1 Samuel 1.1-20, Luke 1.57-80
proper-9-tue: MP: 1 Samuel 1.21—2.11, Luke 2.1-20; EP: 1 Samuel 2.12-26, Luke 2.21-40
proper-9-wed: MP: 1 Samuel 2.27-36, Luke 2.41-52; EP: 1 Samuel 3, Luke 3.1-20
proper-9-thu: MP: 1 Samuel 4.1-18, Luke 3.21-38; EP: 1 Samuel 5, Luke 4.1-13
proper-9-fri: MP: 1 Samuel 6.1-16, Luke 4.14-30; EP: 1 Samuel 7, Luke 4.31-44
proper-9-sat: MP: 1 Samuel 8, Luke 5.1-11; EP: 1 Samuel 9.1-14, Luke 5.12-26
proper-10-mon: MP: 1 Samuel 9.15—10.1, Luke 5.27-39; EP: 1 Samuel 10.1-16, Luke 6.1-11
proper-10-tue: MP: 1 Samuel 10.17-27, Luke 6.12-26; EP: 1 Samuel 11, Luke 6.27-38
proper-10-wed: MP: 1 Samuel 12, Luke 6.39-49; EP: 1 Samuel 13.1-18, Luke 7.1-10
proper-10-thu: MP: 1 Samuel 13.19—14.15, Luke 7.11-17; EP: 1 Samuel 14.24-46, Luke 7.18-35
proper-10-fri: MP: 1 Samuel 15.1-23, Luke 7.36-50; EP: 1 Samuel 15.24-35, Luke 8.1-15
proper-10-sat: MP: 1 Samuel 16, Luke 8.16-25; EP: 1 Samuel 17.1-30, Luke 8.26-39
proper-11-mon: MP: 1 Samuel 17.31-54, Luke 8.40-56; EP: 1 Samuel 17.55—18.16, Luke 9.1-17
proper-11-tue: MP: 1 Samuel 19.1-18, Luke 9.18-27; EP: 1 Samuel 20.1-17, Luke 9.28-36
proper-11-wed: MP: 1 Samuel 20.18-42, Luke 9.37-50; EP: 1 Samuel 21.1—22.5, Luke 9.51-62
proper-11-thu: MP: 1 Samuel 22.6-23, Luke 10.1-16; EP: 1 Samuel 23, Luke 10.17-24
proper-11-fri: MP: 1 Samuel 24, Luke 10.25-37; EP: 1 Samuel 25.1-31, Luke 10.38-42
proper-11-sat: MP: 1 Samuel 25.32-44, Luke 11.1-13; EP: 1 Samuel 26, Luke 11.14-28
proper-12-mon: MP: 1 Samuel 28.3-25, Luke 11.29-36; EP: 1 Samuel 31, Luke 11.37-54
proper-12-tue: MP: 2 Samuel 1, Luke 12.1-12; EP: 2 Samuel 2.1-11, Luke 12.13-21
proper-12-wed: MP: 2 Samuel 3.6-21, Luke 12.22-34; EP: 2 Samuel 3.22-39, Luke 12.35-48
proper-12-thu: MP: 2 Samuel 5.1-12, Luke 12.49-59; EP: 2 Samuel 5.17—6.12a, Luke 13.1-9
proper-12-fri: MP: 2 Samuel 6.12b-23, Luke 13.10-21; EP: 2 Samuel 7.1-17, Luke 13.22-35
proper-12-sat: MP: 2 Samuel 7.18-29, Luke 14.1-14; EP: 2 Samuel 9, Luke 14.15-24
proper-13-mon: MP: 2 Samuel 11, Luke 14.25-35; EP: 2 Samuel 12.1-25, Luke 15.1-10
proper-13-tue: MP: 2 Samuel 13.1-22, Luke 15.11-32; EP: 2 Samuel 13.23-39, Luke 16.1-18
proper-13-wed: MP: 2 Samuel 14.1-24, Luke 16.19-31; EP: 2 Samuel 15.1-12, Luke 17.1-10
proper-13-thu: MP: 2 Samuel 15.13-29, Luke 17.11-19; EP: 2 Samuel 15.30—16.4, Luke 17.20-37
proper-13-fri: MP: 2 Samuel 16.5-23, Luke 18.1-14; EP: 2 Samuel 17.1-23, Luke 18.15-30
proper-13-sat: MP: 2 Samuel 18.1-18, Luke 18.31-43; EP: 2 Samuel 18.19-33, Luke 19.1-10
proper-14-mon: MP: 2 Samuel 19.1-18, Luke 19.11-27; EP: 2 Samuel 19.19-39, Luke 19.28-40
proper-14-tue: MP: 2 Samuel 19.40—20.13, Luke 19.41-48; EP: 2 Samuel 23.1-7, Luke 20.1-8
proper-14-wed: MP: 2 Samuel 24.1-17, Luke 20.9-19; EP: 2 Samuel 24.18-25, Luke 20.20-40
proper-14-thu: MP: 1 Kings 1.1-31, Luke 20.41—21.4; EP: 1 Kings 1.32-53, Luke 21.5-24
proper-14-fri: MP: 1 Kings 2.1-12, Luke 21.25-38; EP: 1 Kings 3.1-15, Luke 22.1-13
proper-14-sat: MP: 1 Kings 3.16-28, Luke 22.14-23; EP: 1 Kings 4.29-34, Luke 22.24-38
proper-15-mon: MP: 1 Kings 5, Luke 22.39-53; EP: 1 Kings 6.1-14, Luke 22.54-71
proper-15-tue: MP: 1 Kings 6.23-38, Luke 23.1-12; EP: 1 Kings 8.1-21, Luke 23.13-25
proper-15-wed: MP: 1 Kings 8.22-53, Luke 23.26-43; EP: 1 Kings 8.54-66, Luke 23.44-56a
proper-15-thu: MP: 1 Kings 10.1-13, Luke 23.56b—24.12; EP: 1 Kings 11.1-13, Luke 24.13-35
proper-15-fri: MP: 1 Kings 11.26-40, Luke 24.36-53; EP: 1 Kings 12.1-24, John 1.1-18
proper-15-sat: MP: 1 Kings 12.25-33, John 1.19-34; EP: 1 Kings 13.1-10, John 1.35-51
proper-16-mon: MP: 1 Kings 13.11-34, John 2; EP: 1 Kings 14.1-20, John 3.1-21
proper-16-tue: MP: 1 Kings 16.23-34, John 3.22-36; EP: 1 Kings 17.1-16, John 4.1-26
proper-16-wed: MP: 1 Kings 17.17-24, John 4.27-42; EP: 1 Kings 18.1-20, John 4.43-54
proper-16-thu: MP: 1 Kings 18.21-40, John 5.1-18; EP: 1 Kings 19.1-18, John 5.19-29
proper-16-fri: MP: 1 Kings 19.19-21, John 5.30-47; EP: 1 Kings 20.1-22, John 6.1-15
proper-16-sat: MP: 1 Kings 20.23-43, John 6.16-40; EP: 1 Kings 21, John 6.41-58
proper-17-mon: MP: 1 Kings 22.1-28, John 6.59-71; EP: 1 Kings 22.29-45, John 7.1-13
proper-17-tue: MP: 2 Kings 1, John 7.14-36; EP: 2 Kings 2.1-18, John 7.37-52
proper-17-wed: MP: 2 Kings 4.1-37, John 8.1-11; EP: 2 Kings 5, John 8.12-30
proper-17-thu: MP: 2 Kings 6.1-23, John 8.31-47; EP: 2 Kings 6.24—7.2, John 8.48-59
proper-17-fri: MP: 2 Kings 7.3-20, John 9.1-17; EP: 2 Kings 9.1-16, John 9.18-41
proper-17-sat: MP: 2 Kings 9.17-37, John 10.1-21; EP: 2 Kings 11.1-20, John 10.22-42
proper-18-mon: MP: 2 Kings 12.1-19, John 11.1-27; EP: 2 Kings 17.1-23, John 11.28-44
proper-18-tue: MP: 2 Kings 17.24-41, John 11.45-57; EP: 2 Kings 18.1-12, John 12.1-19
proper-18-wed: MP: 2 Kings 18.13-37, John 12.20-36; EP: 2 Kings 19.1-19, John 12.37-50
proper-18-thu: MP: 2 Kings 19.20-37, John 13.1-20; EP: 2 Kings 20, John 13.21-38
proper-18-fri: MP: 2 Kings 21.1-18, John 14; EP: 2 Kings 22, John 15.1-17
proper-18-sat: MP: 2 Kings 23.1-25, John 15.18-27; EP: 2 Kings 23.36—24.7, John 16.1-15
proper-19-mon: MP: 2 Kings 24.8-17, John 16.16-33; EP: 2 Kings 24.18—25.12, John 17
proper-19-tue: MP: 2 Kings 25.22-30, John 18.1-14; EP: Ezekiel 1.1-14, John 18.15-27
proper-19-wed: MP: Ezekiel 2.1—3.4, John 18.28-40; EP: Ezekiel 3.4-21, John 19.1-16
proper-19-thu: MP: Ezekiel 8, John 19.17-30; EP: Ezekiel 10.1-19, John 19.31-42
proper-19-fri: MP: Ezekiel 11.14-25, John 20.1-18; EP: Ezekiel 12.1-16, John 20.19-31
proper-19-sat: MP: Ezekiel 12.17-28, John 21; EP: Ezekiel 13.1-16, Romans 1
proper-20-mon: MP: Ezekiel 14.1-11, Romans 2; EP: Ezekiel 14.12-23, Romans 3
proper-20-tue: MP: Ezekiel 16.1-34, Romans 4; EP: Ezekiel 16.35-52, Romans 5
proper-20-wed: MP: Ezekiel 16.53-63, Romans 6; EP: Ezekiel 17, Romans 7
proper-20-thu: MP: Ezekiel 18.1-20, Romans 8.1-17; EP: Ezekiel 18.21-32, Romans 8.18-39
proper-20-fri: MP: Ezekiel 20.1-20, Romans 9.1-18; EP: Ezekiel 20.21-38, Romans 9.19-33
proper-20-sat: MP: Ezekiel 24.1-14, Romans 10; EP: Ezekiel 24.15-27, Romans 11.1-24
proper-21-mon: MP: Ezekiel 28.1-19, Romans 11.25-36; EP: Ezekiel 33.1-20, Romans 12
proper-21-tue: MP: Ezekiel 33.21-33, Romans 13; EP: Ezekiel 34.1-16, Romans 14
proper-21-wed: MP: Ezekiel 34.17-31, Romans 15.1-13; EP: Ezekiel 36.16-36, Romans 15.14-33
proper-21-thu: MP: Ezekiel 37.1-14, Romans 16; EP: Ezekiel 37.15-28, 1 Corinthians 1
proper-21-fri: MP: Ezekiel 39.21-29, 1 Corinthians 2; EP: Ezekiel 40.1-4; 43.1-12, 1 Corinthians 3
proper-21-sat: MP: Ezekiel 47.1-12, 1 Corinthians 4; EP: Daniel 1, 1 Corinthians 5
proper-22-mon: MP: Daniel 2.1-24, 1 Corinthians 6; EP: Daniel 2.25-49, 1 Corinthians 7.1-24
proper-22-tue: MP: Daniel 3.1-18, 1 Corinthians 7.25-40; EP: Daniel 3.19-30, 1 Corinthians 8
proper-22-wed: MP: Daniel 4.1-18, 1 Corinthians 9; EP: Daniel 4.19-37, 1 Corinthians 10.1-22
proper-22-thu: MP: Daniel 5.1-12, 1 Corinthians 10.23—11.1; EP: Daniel 5.13-30, 1 Corinthians 11.2-22
proper-22-fri: MP: Daniel 6.1-12, 1 Corinthians 11.23-34; EP: Daniel 6.13-28, 1 Corinthians 12.1-11
proper-22-sat: MP: Daniel 7.1-14, 1 Corinthians 12.12-31; EP: Daniel 7.15-28, 1 Corinthians 13
proper-23-mon: MP: Daniel 8.1-14, 1 Corinthians 14.1-19; EP: Daniel 8.15-27, 1 Corinthians 14.20-40
proper-23-tue: MP: Daniel 9.1-19, 1 Corinthians 15.1-19; EP: Daniel 9.20-27, 1 Corinthians 15.20-34
proper-23-wed: MP: Daniel 10.1—11.1, 1 Corinthians 15.35-50; EP: Daniel 11.2-19, 1 Corinthians 15.51-58
proper-23-thu: MP: Daniel 11.20-39, 1 Corinthians 16; EP: Daniel 11.40—12.4, 2 Corinthians 1.1-14
proper-23-fri: MP: Daniel 12.5-13, 2 Corinthians 1.15—2.4; EP: Joel 1.1-14, 2 Corinthians 2.5-17
proper-23-sat: MP: Joel 1.15—2.11, 2 Corinthians 3; EP: Joel 2.12-27, 2 Corinthians 4
proper-24-mon: MP: Joel 2.28—3.3, 2 Corinthians 5; EP: Joel 3.9-21, 2 Corinthians 6
proper-24-tue: MP: Amos 1, 2 Corinthians 7; EP: Amos 2, 2 Corinthians 8
proper-24-wed: MP: Amos 3, 2 Corinthians 9; EP: Amos 4, 2 Corinthians 10
proper-24-thu: MP: Amos 5.1-17, 2 Corinthians 11.1-15; EP: Amos 5.18-27, 2 Corinthians 11.16-33
proper-24-fri: MP: Amos 6, 2 Corinthians 12; EP: Amos 7, 2 Corinthians 13
proper-24-sat: MP: Amos 8, Galatians 1; EP: Amos 9, Galatians 2
proper-25-mon: MP: Obadiah, Galatians 3; EP: Jonah 1, Galatians 4
proper-25-tue: MP: Jonah 2, Galatians 5; EP: Jonah 3, Galatians 6
proper-25-wed: MP: Jonah 4, 1 John 1; EP: Micah 1, 1 John 2.1-14
proper-25-thu: MP: Micah 2, 1 John 2.15-29; EP: Micah 3, 1 John 3.1-10
proper-25-fri: MP: Micah 4.1—5.1, 1 John 3.11—4.6; EP: Micah 5.2-15, 1 John 4.7-21
proper-25-sat: MP: Micah 6, 1 John 5; EP: Micah 7, 2 John
kingdom-4-mon: MP: Nahum 1, 3 John; EP: Nahum 2, Jude
kingdom-4-tue: MP: Nahum 3, Revelation 1; EP: Habakkuk 1, Revelation 2.1-17
kingdom-4-wed: MP: Habakkuk 2, Revelation 2.18—3.6; EP: Habakkuk 3, Revelation 3.7-22
kingdom-4-thu: MP: Zephaniah 1, Revelation 4; EP: Zephaniah 2, Revelation 5
kingdom-4-fri: MP: Zephaniah 3, Revelation 6; EP: Haggai 1, Revelation 7
kingdom-4-sat: MP: Haggai 2, Revelation 8; EP: Zechariah 1.1-17, Revelation 9
kingdom-3-mon: MP: Zechariah 1.18—2.13, Revelation 10; EP: Zechariah 3, Revelation 11
kingdom-3-tue: MP: Zechariah 4, Revelation 12; EP: Zechariah 5, Revelation 13
kingdom-3-wed: MP: Zechariah 6.1-15, Revelation 14; EP: Zechariah 7, Revelation 15
kingdom-3-thu: MP: Zechariah 8.1-8, Revelation 16; EP: Zechariah 8.9-23, Revelation 17
kingdom-3-fri: MP: Zechariah 9, Revelation 18; EP: Zechariah 10, Revelation 19
kingdom-3-sat: MP: Zechariah 11, Revelation 20; EP: Zechariah 12, Revelation 21.1-14
kingdom-2-mon: MP: Zechariah 13, Revelation 21.15-27; EP: Zechariah 14, Revelation 22
kingdom-2-tue: MP: Malachi 1, Matthew 1; EP: Malachi 2.1-16, Matthew 2
kingdom-2-wed: MP: Malachi 2.17—3.12, Matthew 3; EP: Malachi 3.13—4.6, Matthew 4
kingdom-2-thu: MP: Isaiah 40.1-11, Matthew 5.1-20; EP: Isaiah 40.12-31, Matthew 5.21-48
kingdom-2-fri: MP: Isaiah 41.1-20, Matthew 6.1-18; EP: Isaiah 41.21—42.9, Matthew 6.19-34
kingdom-2-sat: MP: Isaiah 42.10-25, Matthew 7; EP: Isaiah 43.1-13, Matthew 8.1-17
"""

def main():
    entries = []
    for line in DATA.strip().split('\n'):
        line = line.strip()
        if not line or line.startswith('#'):
            continue
        parsed = parse_day_line(line)
        entries.extend(parsed)

    output_path = os.path.join(os.path.dirname(__file__), 'data', 'lectionary-readings-bcp-office.json')
    with open(output_path, 'w') as f:
        json.dump(entries, f, indent=2)

    print(f'Generated {len(entries)} BCP office readings')
    print(f'Output: {output_path}')

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
