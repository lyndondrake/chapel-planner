#!/usr/bin/env python3
"""
Generate an expanded lectionary-occasions.json file.

Reads the existing occasions (68 entries covering Sundays and major feasts),
then adds:
  - Weekday occasions (Mon-Sat) for each liturgical week
  - Fixed feasts and holy days not already present

The result is written back to the same file.
"""

import json
import os
from pathlib import Path

SCRIPT_DIR = Path(__file__).resolve().parent
DATA_FILE = SCRIPT_DIR / 'data' / 'lectionary-occasions.json'

DAY_ABBREVS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat']
DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

# Season colours
SEASON_COLOURS = {
    'advent': 'purple',
    'christmas': 'white',
    'epiphany': 'white',
    'lent': 'purple',
    'holy_week': 'purple',
    'easter': 'white',
    'pentecost': 'red',
    'trinity': 'green',
    'ordinary_time': 'green',
    'kingdom': 'green',
}

# Fixed feasts to add (slug, name, month, day, priority, season, colour)
FIXED_FEASTS = [
    ('st-stephen', 'St Stephen', 12, 26, 90, 'christmas', 'red'),
    ('st-john-evangelist', 'St John the Evangelist', 12, 27, 90, 'christmas', 'white'),
    ('holy-innocents', 'Holy Innocents', 12, 28, 90, 'christmas', 'red'),
    ('naming-of-jesus', 'Naming of Jesus', 1, 1, 90, 'christmas', 'white'),
    ('conversion-of-st-paul', 'Conversion of St Paul', 1, 25, 90, 'epiphany', 'white'),
    # candlemas already exists
    ('st-joseph', 'St Joseph', 3, 19, 90, 'lent', 'white'),
    ('annunciation', 'Annunciation of Our Lord', 3, 25, 90, 'lent', 'white'),
    ('st-mark', 'St Mark', 4, 25, 80, 'easter', 'red'),
    ('ss-philip-and-james', 'SS Philip & James', 5, 1, 80, 'easter', 'red'),
    ('st-matthias', 'St Matthias', 5, 14, 80, 'easter', 'red'),
    ('visit-of-mary', 'Visit of Mary to Elizabeth', 5, 31, 80, 'easter', 'white'),
    ('st-barnabas', 'St Barnabas', 6, 11, 80, 'ordinary_time', 'red'),
    ('birth-of-st-john-baptist', 'Birth of St John the Baptist', 6, 24, 90, 'ordinary_time', 'white'),
    ('ss-peter-and-paul', 'SS Peter & Paul', 6, 29, 90, 'ordinary_time', 'red'),
    ('st-thomas', 'St Thomas', 7, 3, 80, 'ordinary_time', 'red'),
    ('st-mary-magdalene', 'St Mary Magdalene', 7, 22, 80, 'ordinary_time', 'white'),
    ('st-james', 'St James', 7, 25, 90, 'ordinary_time', 'red'),
    ('transfiguration', 'Transfiguration of Our Lord', 8, 6, 90, 'ordinary_time', 'white'),
    ('blessed-virgin-mary', 'Blessed Virgin Mary', 8, 15, 90, 'ordinary_time', 'white'),
    ('st-bartholomew', 'St Bartholomew', 8, 24, 80, 'ordinary_time', 'red'),
    ('holy-cross-day', 'Holy Cross Day', 9, 14, 80, 'ordinary_time', 'red'),
    ('st-matthew', 'St Matthew', 9, 21, 90, 'ordinary_time', 'red'),
    ('st-michael-all-angels', 'St Michael & All Angels', 9, 29, 90, 'ordinary_time', 'white'),
    ('st-luke', 'St Luke', 10, 18, 80, 'ordinary_time', 'red'),
    ('ss-simon-and-jude', 'SS Simon & Jude', 10, 28, 80, 'ordinary_time', 'red'),
    # all-saints already exists
    ('all-souls', 'All Souls', 11, 2, 80, 'kingdom', 'purple'),
    ('st-andrew', 'St Andrew', 11, 30, 90, 'advent', 'red'),
]


def make_weekday_occasion(season, week_num, day_idx, season_label=None, colour=None):
    """Create a weekday occasion dict.

    day_idx: 0=Mon .. 5=Sat
    """
    abbrev = DAY_ABBREVS[day_idx]
    day_name = DAY_NAMES[day_idx]
    day_of_week = day_idx + 1  # Mon=1 .. Sat=6

    if season_label is None:
        season_label = season.replace('_', ' ').title()

    name = f'{day_name} of {season_label} Week {week_num}'
    slug = f'{season.replace("_", "-")}-{week_num}-{abbrev}'

    if colour is None:
        colour = SEASON_COLOURS.get(season, 'green')

    return {
        'name': name,
        'slug': slug,
        'season': season,
        'colour': colour,
        'isFixed': False,
        'weekOfSeason': week_num,
        'dayOfWeek': day_of_week,
        'priority': 30,
    }


def make_fixed_feast(slug, name, month, day, priority, season, colour):
    return {
        'name': name,
        'slug': slug,
        'season': season,
        'colour': colour,
        'isFixed': True,
        'fixedMonth': month,
        'fixedDay': day,
        'priority': priority,
    }


def generate_weekday_occasions():
    """Generate all weekday occasions for each liturgical week."""
    weekdays = []

    # Advent weeks 1-4
    for week in range(1, 5):
        for d in range(6):
            weekdays.append(make_weekday_occasion('advent', week, d, 'Advent'))

    # Christmas specific days (Dec 26-31, Jan 1)
    # These are date-specific rather than week-numbered, so handle specially
    christmas_days = [
        ('christmas-dec-26', 'December 26', 12, 26),
        ('christmas-dec-27', 'December 27', 12, 27),
        ('christmas-dec-28', 'December 28', 12, 28),
        ('christmas-dec-29', 'December 29', 12, 29),
        ('christmas-dec-30', 'December 30', 12, 30),
        ('christmas-dec-31', 'December 31', 12, 31),
        ('christmas-jan-1', 'January 1', 1, 1),
    ]
    for slug, date_label, month, day in christmas_days:
        weekdays.append({
            'name': f'Christmas Season — {date_label}',
            'slug': slug,
            'season': 'christmas',
            'colour': 'white',
            'isFixed': True,
            'fixedMonth': month,
            'fixedDay': day,
            'priority': 30,
        })

    # Epiphany weeks 1-4
    for week in range(1, 5):
        for d in range(6):
            weekdays.append(make_weekday_occasion('epiphany', week, d, 'Epiphany'))

    # Before Lent weekdays (weeks 1-2)
    for week in range(1, 3):
        for d in range(6):
            occ = make_weekday_occasion('ordinary_time', week, d, 'Before Lent')
            occ['slug'] = f'before-lent-{week}-{DAY_ABBREVS[d]}'
            weekdays.append(occ)

    # Lent weeks 1-5
    for week in range(1, 6):
        for d in range(6):
            weekdays.append(make_weekday_occasion('lent', week, d, 'Lent'))

    # Easter weeks 2-7
    for week in range(2, 8):
        for d in range(6):
            weekdays.append(make_weekday_occasion('easter', week, d, 'Easter'))

    # Proper weeks 4-25
    for week in range(4, 26):
        for d in range(6):
            occ = make_weekday_occasion('ordinary_time', week, d, 'Proper')
            occ['slug'] = f'proper-{week}-{DAY_ABBREVS[d]}'
            weekdays.append(occ)

    # Kingdom weeks 4, 3, 2 (counting down)
    for week in [4, 3, 2]:
        for d in range(6):
            weekdays.append(make_weekday_occasion('kingdom', week, d, 'Kingdom'))

    return weekdays


def main():
    # Read existing occasions
    with open(DATA_FILE, 'r') as f:
        existing = json.load(f)

    existing_slugs = {occ['slug'] for occ in existing}
    print(f'Existing occasions: {len(existing)}')

    # Generate weekday occasions
    weekday_occasions = generate_weekday_occasions()
    new_weekdays = [occ for occ in weekday_occasions if occ['slug'] not in existing_slugs]
    print(f'New weekday occasions: {len(new_weekdays)}')

    # Generate fixed feasts
    new_feasts = []
    for args in FIXED_FEASTS:
        feast = make_fixed_feast(*args)
        if feast['slug'] not in existing_slugs:
            new_feasts.append(feast)
    print(f'New fixed feasts: {len(new_feasts)}')

    # Combine: existing first, then weekdays, then feasts
    all_occasions = existing + new_weekdays + new_feasts
    print(f'Total occasions: {len(all_occasions)}')

    # Write output
    with open(DATA_FILE, 'w') as f:
        json.dump(all_occasions, f, indent=2)
        f.write('\n')

    print(f'Written to {DATA_FILE}')


if __name__ == '__main__':
    main()
