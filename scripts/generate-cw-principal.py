#!/usr/bin/env python3
"""Generate CW Principal Service lectionary readings JSON."""

import json
import re
from pathlib import Path
from collections import Counter

OUTPUT_PATH = Path(__file__).parent / "data" / "lectionary-readings-cw-principal.json"
READING_TYPES=["old_testament","psalm","epistle","gospel"]
SORT_ORDERS={"old_testament":1,"psalm":2,"epistle":3,"gospel":4}

def parse_reference(s):
    s=s.strip()
    R=dict(reference=s,book=None,chapter=None,verseStart=None,verseEnd=None)
    bm=re.match("test",s)
    bm=re.match(r"^(\d?\s?[A-Za-z]+(?:\s(?:of\s)?[A-Za-z]+)*)\s+(.+)$",s)
    if not bm:
        R["book"]=s
        return R
    R["book"]=bm.group(1)
    rem=bm.group(2)
    cc=re.match(r"^(\d+)\.(\d+\w?)\s*—\s*(\d+)\.",rem)
    if cc:
        R["chapter"]=cc.group(1)
        R["verseStart"]=re.sub(r"[a-z]","",cc.group(2))
        return R
    cc2=re.match(r"^(\d+)\.(\d+).*—\s*(\d+)\.",rem)
    if cc2:
        R["chapter"]=cc2.group(1)
        R["verseStart"]=cc2.group(2)
        return R
    if ";" in rem:
        fs=rem.split(";")[0].strip()
        m=re.match(r"^(\d+)\.(\d+)",fs)
        if m:
            R["chapter"]=m.group(1)
            R["verseStart"]=m.group(2)
            return R
    m=re.match(r"^(\d+)\.(.+)$",rem)
    if m:
        R["chapter"]=m.group(1)
        nums=re.findall(r"(\d+)",m.group(2))
        if nums:
            R["verseStart"]=nums[0]
            R["verseEnd"]=nums[-1] if len(nums)>1 else nums[0]
        return R
    wv=re.match(r"^(\d+)(?:\s*[-–]\s*(\d+))?$",rem)
    if wv:
        ch=wv.group(1);ev=wv.group(2)
        scb=["Obadiah","Philemon","2 John","3 John","Jude"]
        if R["book"] in scb:
            R["chapter"]="1";R["verseStart"]=ch;R["verseEnd"]=ev
        else:
            R["chapter"]=ch
        return R
    wc=re.match(r"^(\d+)$",rem)
    if wc:
        R["chapter"]=wc.group(1)
        return R
    R["chapter"]=rem
    return R

def build_data():
    readings=[]
    def add(slug,year,ot,ps,ep,go):
        refs=[ot,ps,ep,go]
        for i,rt in enumerate(READING_TYPES):
            pr=parse_reference(refs[i])
            readings.append(dict(
                occasionSlug=slug,tradition="cw",serviceContext="principal",
                readingType=rt,reference=pr["reference"],book=pr["book"],
                chapter=pr["chapter"],verseStart=pr["verseStart"],verseEnd=pr["verseEnd"],
                alternateYear=year,isOptional=False,sortOrder=SORT_ORDERS[rt]))
    # Fixed occasions
    add("christmas-day",None,"Isaiah 9.2-7","Psalm 96","Titus 2.11-14","Luke 2.1-14")
    add("christmas-2",None,"Jeremiah 31.7-14","Psalm 147.13-21","Ephesians 1.3-14","John 1.1-18")
    add("epiphany",None,"Isaiah 60.1-6","Psalm 72.1-15","Ephesians 3.1-12","Matthew 2.1-12")
    add("candlemas",None,"Malachi 3.1-5","Psalm 24.7-10","Hebrews 2.14-18","Luke 2.22-40")
    add("ash-wednesday",None,"Joel 2.1-2,12-17","Psalm 51.1-18","2 Corinthians 5.20b—6.10","Matthew 6.1-6,16-21")
    add("maundy-thursday",None,"Exodus 12.1-14","Psalm 116.1,10-17","1 Corinthians 11.23-26","John 13.1-17,31b-35")
    add("good-friday",None,"Isaiah 52.13—53.12","Psalm 22","Hebrews 10.16-25","John 18.1—19.42")
    add("ascension-day",None,"Acts 1.1-11","Psalm 47","Ephesians 1.15-23","Luke 24.44-53")
    add("all-saints",None,"Revelation 7.9-17","Psalm 34.1-10","1 John 3.1-3","Matthew 5.1-12")
    # Year A - Advent & Christmas
    add("advent-1","A","Isaiah 2.1-5","Psalm 122","Romans 13.11-14","Matthew 24.36-44")
    add("advent-2","A","Isaiah 11.1-10","Psalm 72.1-7,18-19","Romans 15.4-13","Matthew 3.1-12")
    add("advent-3","A","Isaiah 35.1-10","Psalm 146.4-10","James 5.7-10","Matthew 11.2-11")
    add("advent-4","A","Isaiah 7.10-16","Psalm 80.1-8,18-20","Romans 1.1-7","Matthew 1.18-25")
    add("christmas-1","A","Isaiah 63.7-9","Psalm 148","Hebrews 2.10-18","Matthew 2.13-23")
    add("epiphany-1","A","Isaiah 42.1-9","Psalm 29","Acts 10.34-43","Matthew 3.13-17")
    add("epiphany-2","A","Isaiah 49.1-7","Psalm 40.1-12","1 Corinthians 1.1-9","John 1.29-42")
    add("epiphany-3","A","Isaiah 9.1-4","Psalm 27.1,4-12","1 Corinthians 1.10-18","Matthew 4.12-23")
    add("epiphany-4","A","1 Kings 17.8-16","Psalm 36.5-10","1 Corinthians 1.18-31","John 2.1-11")
    add("before-lent-2","A","Genesis 1.1—2.3","Psalm 136","Romans 8.18-25","Matthew 6.25-34")
    add("before-lent-1","A","Exodus 24.12-18","Psalm 2","2 Peter 1.16-21","Matthew 17.1-9")
    add("lent-1","A","Genesis 2.15-17; 3.1-7","Psalm 32","Romans 5.12-19","Matthew 4.1-11")
    add("lent-2","A","Genesis 12.1-4a","Psalm 121","Romans 4.1-5,13-17","John 3.1-17")
    add("lent-3","A","Exodus 17.1-7","Psalm 95","Romans 5.1-11","John 4.5-42")
    add("lent-4","A","1 Samuel 16.1-13","Psalm 23","Ephesians 5.8-14","John 9.1-41")
    add("lent-5","A","Ezekiel 37.1-14","Psalm 130","Romans 8.6-11","John 11.1-45")
    add("palm-sunday","A","Isaiah 50.4-9a","Psalm 31.9-16","Philippians 2.5-11","Matthew 26.14—27.66")
    add("easter-day","A","Acts 10.34-43","Psalm 118.1-2,14-24","Colossians 3.1-4","John 20.1-18")
    add("easter-2","A","Acts 2.14a,22-32","Psalm 16","1 Peter 1.3-9","John 20.19-31")
    add("easter-3","A","Acts 2.14a,36-41","Psalm 116.1-3,10-17","1 Peter 1.17-23","Luke 24.13-35")
    add("easter-4","A","Acts 2.42-47","Psalm 23","1 Peter 2.19-25","John 10.1-10")
    add("easter-5","A","Acts 7.55-60","Psalm 31.1-5,15-16","1 Peter 2.2-10","John 14.1-14")
    add("easter-6","A","Acts 17.22-31","Psalm 66.7-18","1 Peter 3.13-22","John 14.15-21")
    add("easter-7","A","Acts 1.6-14","Psalm 68.1-10,32-35","1 Peter 4.12-14; 5.6-11","John 17.1-11")
    add("pentecost","A","Acts 2.1-21","Psalm 104.26-36,37b","1 Corinthians 12.3b-13","John 20.19-23")
    add("trinity-sunday","A","Isaiah 40.12-17,27-31","Psalm 8","2 Corinthians 13.11-13","Matthew 28.16-20")
    add("proper-4","A","Genesis 6.9-22; 7.24; 8.14-19","Psalm 46","Romans 1.16-17; 3.22b-28","Matthew 7.21-29")
    add("proper-5","A","Genesis 12.1-9","Psalm 33.1-12","Romans 4.13-25","Matthew 9.9-13,18-26")
    add("proper-6","A","Genesis 18.1-15","Psalm 116.1,10-17","Romans 5.1-8","Matthew 9.35—10.8")
    add("proper-7","A","Genesis 21.8-21","Psalm 86.1-10,16-17","Romans 6.1b-11","Matthew 10.24-39")
    add("proper-8","A","Genesis 22.1-14","Psalm 13","Romans 6.12-23","Matthew 10.40-42")
    add("proper-9","A","Genesis 24.34-38,42-49,58-67","Psalm 45.10-17","Romans 7.15-25a","Matthew 11.16-19,25-30")
    add("proper-10","A","Genesis 25.19-34","Psalm 119.105-112","Romans 8.1-11","Matthew 13.1-9,18-23")
    add("proper-11","A","Genesis 28.10-19a","Psalm 139.1-11,22-23","Romans 8.12-25","Matthew 13.24-30,36-43")
    add("proper-12","A","Genesis 29.15-28","Psalm 105.1-11,45b","Romans 8.26-39","Matthew 13.31-33,44-52")
    add("proper-13","A","Genesis 32.22-31","Psalm 17.1-7,16","Romans 9.1-5","Matthew 14.13-21")
    add("proper-14","A","Genesis 37.1-4,12-28","Psalm 105.1-6,16-22,45b","Romans 10.5-15","Matthew 14.22-33")
    add("proper-15","A","Genesis 45.1-15","Psalm 133","Romans 11.1-2a,29-32","Matthew 15.10-28")
    add("proper-16","A","Exodus 1.8—2.10","Psalm 124","Romans 12.1-8","Matthew 16.13-20")
    add("proper-17","A","Exodus 3.1-15","Psalm 105.1-6,23-26,45b","Romans 12.9-21","Matthew 16.21-28")
    add("proper-18","A","Exodus 12.1-14","Psalm 149","Romans 13.8-14","Matthew 18.15-20")
    add("proper-19","A","Exodus 14.19-31","Psalm 114","Romans 14.1-12","Matthew 18.21-35")
    add("proper-20","A","Exodus 16.2-15","Psalm 105.1-6,37-45","Philippians 1.21-30","Matthew 20.1-16")
    add("proper-21","A","Exodus 17.1-7","Psalm 78.1-4,12-16","Philippians 2.1-13","Matthew 21.23-32")
    add("proper-22","A","Exodus 20.1-4,7-9,12-20","Psalm 19","Philippians 3.4b-14","Matthew 21.33-46")
    add("proper-23","A","Exodus 32.1-14","Psalm 106.1-6,19-23","Philippians 4.1-9","Matthew 22.1-14")
    add("proper-24","A","Exodus 33.12-23","Psalm 99","1 Thessalonians 1.1-10","Matthew 22.15-22")
    add("proper-25","A","Deuteronomy 34.1-12","Psalm 90.1-6,13-17","1 Thessalonians 2.1-8","Matthew 22.34-46")
    add("kingdom-4","A","Deuteronomy 6.1-9","Psalm 119.1-8","1 Thessalonians 2.9-13","Matthew 24.1-14")
    add("kingdom-3","A","Amos 5.18-24","Psalm 70","1 Thessalonians 4.13-18","Matthew 25.1-13")
    add("kingdom-2","A","Zephaniah 1.7,12-18","Psalm 90.1-8,12","1 Thessalonians 5.1-11","Matthew 25.14-30")
    add("christ-the-king","A","Ezekiel 34.11-16,20-24","Psalm 95.1-7","Ephesians 1.15-23","Matthew 25.31-46")
    # Year B - Advent & Christmas
    add("advent-1","B","Isaiah 64.1-9","Psalm 80.1-8,18-20","1 Corinthians 1.3-9","Mark 13.24-37")
    add("advent-2","B","Isaiah 40.1-11","Psalm 85.1-2,8-13","2 Peter 3.8-15a","Mark 1.1-8")
    add("advent-3","B","Isaiah 61.1-4,8-11","Psalm 126","1 Thessalonians 5.16-24","John 1.6-8,19-28")
    add("advent-4","B","2 Samuel 7.1-11,16","Psalm 89.1-4,19-26","Romans 16.25-27","Luke 1.26-38")
    add("christmas-1","B","Isaiah 61.10—62.3","Psalm 148","Galatians 4.4-7","Luke 2.15-21")
    add("epiphany-1","B","Genesis 1.1-5","Psalm 29","Acts 19.1-7","Mark 1.4-11")
    add("epiphany-2","B","1 Samuel 3.1-10","Psalm 139.1-5,12-18","Revelation 5.1-10","John 1.43-51")
    add("epiphany-3","B","Genesis 14.17-20","Psalm 128","Revelation 19.6-10","John 2.1-11")
    add("epiphany-4","B","Deuteronomy 18.15-20","Psalm 111","Revelation 12.1-5a","Mark 1.21-28")
    add("before-lent-2","B","Proverbs 8.1,22-31","Psalm 104.26-35","Colossians 1.15-20","John 1.1-14")
    add("before-lent-1","B","2 Kings 2.1-12","Psalm 50.1-6","2 Corinthians 4.3-6","Mark 9.2-9")
    add("lent-1","B","Genesis 9.8-17","Psalm 25.1-9","1 Peter 3.18-22","Mark 1.9-15")
    add("lent-2","B","Genesis 17.1-7,15-16","Psalm 22.23-31","Romans 4.13-25","Mark 8.31-38")
    add("lent-3","B","Exodus 20.1-17","Psalm 19","1 Corinthians 1.18-25","John 2.13-22")
    add("lent-4","B","Numbers 21.4-9","Psalm 107.1-3,17-22","Ephesians 2.1-10","John 3.14-21")
    add("lent-5","B","Jeremiah 31.31-34","Psalm 51.1-12","Hebrews 5.5-10","John 12.20-33")
    add("palm-sunday","B","Isaiah 50.4-9a","Psalm 31.9-16","Philippians 2.5-11","Mark 14.1—15.47")
    add("easter-day","B","Acts 10.34-43","Psalm 118.1-2,14-24","1 Corinthians 15.1-11","John 20.1-18")
    add("easter-2","B","Acts 4.32-35","Psalm 133","1 John 1.1—2.2","John 20.19-31")
    add("easter-3","B","Acts 3.12-19","Psalm 4","1 John 3.1-7","Luke 24.36b-48")
    add("easter-4","B","Acts 4.5-12","Psalm 23","1 John 3.16-24","John 10.11-18")
    add("easter-5","B","Acts 8.26-40","Psalm 22.25-31","1 John 4.7-21","John 15.1-8")
    add("easter-6","B","Acts 10.44-48","Psalm 98","1 John 5.1-6","John 15.9-17")
    add("easter-7","B","Acts 1.15-17,21-26","Psalm 1","1 John 5.9-13","John 17.6-19")
    add("pentecost","B","Acts 2.1-21","Psalm 104.26-36,37b","Romans 8.22-27","John 15.26-27; 16.4b-15")
    add("trinity-sunday","B","Isaiah 6.1-8","Psalm 29","Romans 8.12-17","John 3.1-17")
    add("proper-4","B","1 Samuel 3.1-10","Psalm 139.1-5,12-18","2 Corinthians 4.5-12","Mark 2.23—3.6")
    add("proper-5","B","1 Samuel 8.4-11,16-20","Psalm 138","2 Corinthians 4.13—5.1","Mark 3.20-35")
    add("proper-6","B","1 Samuel 15.34—16.13","Psalm 20","2 Corinthians 5.6-10,14-17","Mark 4.26-34")
    add("proper-7","B","1 Samuel 17.1a,4-11,19-23,32-49","Psalm 9.9-20","2 Corinthians 6.1-13","Mark 4.35-41")
    add("proper-8","B","2 Samuel 1.1,17-27","Psalm 130","2 Corinthians 8.7-15","Mark 5.21-43")
    add("proper-9","B","2 Samuel 5.1-5,9-10","Psalm 48","2 Corinthians 12.2-10","Mark 6.1-13")
    add("proper-10","B","2 Samuel 6.1-5,12b-19","Psalm 24","Ephesians 1.3-14","Mark 6.14-29")
    add("proper-11","B","2 Samuel 7.1-14a","Psalm 89.20-37","Ephesians 2.11-22","Mark 6.30-34,53-56")
    add("proper-12","B","2 Samuel 11.1-15","Psalm 14","Ephesians 3.14-21","John 6.1-21")
    add("proper-13","B","2 Samuel 11.26—12.13a","Psalm 51.1-12","Ephesians 4.1-16","John 6.24-35")
    add("proper-14","B","2 Samuel 18.5-9,15,31-33","Psalm 130","Ephesians 4.25—5.2","John 6.35,41-51")
    add("proper-15","B","1 Kings 2.10-12; 3.3-14","Psalm 111","Ephesians 5.15-20","John 6.51-58")
    add("proper-16","B","1 Kings 8.1,6,10-11,22-30,41-43","Psalm 84","Ephesians 6.10-20","John 6.56-69")
    add("proper-17","B","Song of Solomon 2.8-13","Psalm 45.1-2,6-9","James 1.17-27","Mark 7.1-8,14-15,21-23")
    add("proper-18","B","Proverbs 22.1-2,8-9,22-23","Psalm 125","James 2.1-10,14-17","Mark 7.24-37")
    add("proper-19","B","Proverbs 1.20-33","Psalm 19","James 3.1-12","Mark 8.27-38")
    add("proper-20","B","Proverbs 31.10-31","Psalm 1","James 3.13—4.3,7-8a","Mark 9.30-37")
    add("proper-21","B","Esther 7.1-6,9-10; 9.20-22","Psalm 124","James 5.13-20","Mark 9.38-50")
    add("proper-22","B","Job 1.1; 2.1-10","Psalm 26","Hebrews 1.1-4; 2.5-12","Mark 10.2-16")
    add("proper-23","B","Job 23.1-9,16-17","Psalm 22.1-15","Hebrews 4.12-16","Mark 10.17-31")
    add("proper-24","B","Job 38.1-7,34-41","Psalm 104.1-9,25,37b","Hebrews 5.1-10","Mark 10.35-45")
    add("proper-25","B","Job 42.1-6,10-17","Psalm 34.1-8,19-22","Hebrews 7.23-28","Mark 10.46-52")
    add("kingdom-4","B","Deuteronomy 6.1-9","Psalm 119.1-8","Hebrews 9.11-14","Mark 12.28-34")
    add("kingdom-3","B","Jonah 3.1-5,10","Psalm 62.5-12","Hebrews 9.24-28","Mark 1.14-20")
    add("kingdom-2","B","Daniel 12.1-3","Psalm 16","Hebrews 10.11-14,19-25","Mark 13.1-8")
    add("christ-the-king","B","Daniel 7.9-10,13-14","Psalm 93","Revelation 1.4b-8","John 18.33-37")
    # Year C - Advent & Christmas
    add("advent-1","C","Jeremiah 33.14-16","Psalm 25.1-9","1 Thessalonians 3.9-13","Luke 21.25-36")
    add("advent-2","C","Malachi 3.1-4","Psalm 4","Philippians 1.3-11","Luke 3.1-6")
    add("advent-3","C","Zephaniah 3.14-20","Psalm 146.4-10","Philippians 4.4-7","Luke 3.7-18")
    add("advent-4","C","Micah 5.2-5a","Psalm 80.1-8","Hebrews 10.5-10","Luke 1.39-45")
    add("christmas-1","C","1 Samuel 2.18-20,26","Psalm 148","Colossians 3.12-17","Luke 2.41-52")
    add("epiphany-1","C","Isaiah 43.1-7","Psalm 29","Acts 8.14-17","Luke 3.15-17,21-22")
    add("epiphany-2","C","Isaiah 62.1-5","Psalm 36.5-10","1 Corinthians 12.1-11","John 2.1-11")
    add("epiphany-3","C","Nehemiah 8.1-3,5-6,8-10","Psalm 19","1 Corinthians 12.12-31a","Luke 4.14-21")
    add("epiphany-4","C","Ezekiel 43.27—44.4","Psalm 48","1 Corinthians 13.1-13","Luke 2.22-40")
    add("before-lent-2","C","Genesis 2.4b-9,15-25","Psalm 65","Revelation 4","Luke 8.22-25")
    add("before-lent-1","C","Exodus 34.29-35","Psalm 99","2 Corinthians 3.12—4.2","Luke 9.28-36")
    add("lent-1","C","Deuteronomy 26.1-11","Psalm 91.1-2,9-16","Romans 10.8b-13","Luke 4.1-13")
    add("lent-2","C","Genesis 15.1-12,17-18","Psalm 27","Philippians 3.17—4.1","Luke 13.31-35")
    add("lent-3","C","Isaiah 55.1-9","Psalm 63.1-8","1 Corinthians 10.1-13","Luke 13.1-9")
    add("lent-4","C","Joshua 5.9-12","Psalm 32","2 Corinthians 5.16-21","Luke 15.1-3,11b-32")
    add("lent-5","C","Isaiah 43.16-21","Psalm 126","Philippians 3.4b-14","John 12.1-8")
    add("palm-sunday","C","Isaiah 50.4-9a","Psalm 31.9-16","Philippians 2.5-11","Luke 22.14—23.56")
    add("easter-day","C","Acts 10.34-43","Psalm 118.1-2,14-24","1 Corinthians 15.19-26","John 20.1-18")
    add("easter-2","C","Acts 5.27-32","Psalm 150","Revelation 1.4-8","John 20.19-31")
    add("easter-3","C","Acts 9.1-6","Psalm 30","Revelation 5.11-14","John 21.1-19")
    add("easter-4","C","Acts 9.36-43","Psalm 23","Revelation 7.9-17","John 10.22-30")
    add("easter-5","C","Acts 11.1-18","Psalm 148","Revelation 21.1-6","John 13.31-35")
    add("easter-6","C","Acts 16.9-15","Psalm 67","Revelation 21.10,22—22.5","John 14.23-29")
    add("easter-7","C","Acts 16.16-34","Psalm 97","Revelation 22.12-14,16-17,20-21","John 17.20-26")
    add("pentecost","C","Acts 2.1-21","Psalm 104.26-36,37b","Romans 8.14-17","John 14.8-17,25-27")
    add("trinity-sunday","C","Proverbs 8.1-4,22-31","Psalm 8","Romans 5.1-5","John 16.12-15")
    add("proper-4","C","1 Kings 18.20-21,30-39","Psalm 96","Galatians 1.1-12","Luke 7.1-10")
    add("proper-5","C","1 Kings 17.17-24","Psalm 30","Galatians 1.11-24","Luke 7.11-17")
    add("proper-6","C","2 Samuel 11.26—12.10,13-15","Psalm 32","Galatians 2.15-21","Luke 7.36—8.3")
    add("proper-7","C","Isaiah 65.1-9","Psalm 22.19-28","Galatians 3.23-29","Luke 8.26-39")
    add("proper-8","C","1 Kings 19.15-16,19-21","Psalm 16","Galatians 5.1,13-25","Luke 9.51-62")
    add("proper-9","C","2 Kings 5.1-14","Psalm 30","Galatians 6.1-16","Luke 10.1-11,16-20")
    add("proper-10","C","Amos 7.7-17","Psalm 82","Colossians 1.1-14","Luke 10.25-37")
    add("proper-11","C","Genesis 18.1-10a","Psalm 15","Colossians 1.15-28","Luke 10.38-42")
    add("proper-12","C","Genesis 18.20-32","Psalm 138","Colossians 2.6-15,19","Luke 11.1-13")
    add("proper-13","C","Ecclesiastes 1.2,12-14; 2.18-23","Psalm 49.1-12","Colossians 3.1-11","Luke 12.13-21")
    add("proper-14","C","Genesis 15.1-6","Psalm 33.12-22","Hebrews 11.1-3,8-16","Luke 12.32-40")
    add("proper-15","C","Jeremiah 23.23-29","Psalm 82","Hebrews 11.29—12.2","Luke 12.49-56")
    add("proper-16","C","Isaiah 58.9b-14","Psalm 103.1-8","Hebrews 12.18-29","Luke 13.10-17")
    add("proper-17","C","Proverbs 25.6-7","Psalm 112","Hebrews 13.1-8,15-16","Luke 14.1,7-14")
    add("proper-18","C","Deuteronomy 30.15-20","Psalm 1","Philemon 1-21","Luke 14.25-33")
    add("proper-19","C","Exodus 32.7-14","Psalm 51.1-10","1 Timothy 1.12-17","Luke 15.1-10")
    add("proper-20","C","Amos 8.4-7","Psalm 113","1 Timothy 2.1-7","Luke 16.1-13")
    add("proper-21","C","Amos 6.1a,4-7","Psalm 146","1 Timothy 6.6-19","Luke 16.19-31")
    add("proper-22","C","Habakkuk 1.1-4; 2.1-4","Psalm 37.1-9","2 Timothy 1.1-14","Luke 17.5-10")
    add("proper-23","C","2 Kings 5.1-3,7-15c","Psalm 111","2 Timothy 2.8-15","Luke 17.11-19")
    add("proper-24","C","Genesis 32.22-31","Psalm 121","2 Timothy 3.14—4.5","Luke 18.1-8")
    add("proper-25","C","Jeremiah 14.7-10,19-22","Psalm 84.1-7","2 Timothy 4.6-8,16-18","Luke 18.9-14")
    add("kingdom-4","C","Isaiah 1.10-18","Psalm 32.1-7","2 Thessalonians 1.1-12","Luke 19.1-10")
    add("kingdom-3","C","Job 19.23-27a","Psalm 17.1-8","2 Thessalonians 2.1-5,13-17","Luke 20.27-38")
    add("kingdom-2","C","Malachi 4.1-2a","Psalm 98","2 Thessalonians 3.6-13","Luke 21.5-19")
    add("christ-the-king","C","Jeremiah 23.1-6","Psalm 46","Colossians 1.11-20","Luke 23.33-43")
    return readings


def main():
    readings = build_data()
    readings.sort(key=lambda r: (r["occasionSlug"], r["alternateYear"] or "", r["sortOrder"]))
    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    with open(OUTPUT_PATH, "w", encoding="utf-8") as f:
        json.dump(readings, f, indent=2, ensure_ascii=False)
    print(f"Generated {len(readings)} readings to {OUTPUT_PATH}")
    yc = Counter(r["alternateYear"] for r in readings)
    for y, c in sorted(yc.items(), key=lambda x: (x[0] is None, x[0])):
        label = y if y else "Fixed (all years)"
        print(f"  {label}: {c} readings")


if __name__ == "__main__":
    main()
