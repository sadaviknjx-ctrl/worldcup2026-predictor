#!/bin/bash
# 每日数据更新脚本 — 拉最新比赛结果 + 同步赔率
# 用法: bash scripts/daily-update.sh

set -e

SUPABASE_URL="https://cxiwxtbbyuajribyzalu.supabase.co"
SERVICE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN4aXd4dGJieXVhanJpYnl6YWx1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDkxNDc5OCwiZXhwIjoyMDk2NDkwNzk4fQ.MFv1VRDIwWcXy0X8nqxrQnYFwfHFaKsvgglXiZ3orEA"
FOOTBALL_DATA_KEY="e7ce57b0b47849369870d1bdb13c2996"

echo "========================================"
echo " WorldCup 2026 每日数据更新"
echo " $(date '+%Y-%m-%d %H:%M:%S')"
echo "========================================"

# ── Step 1: 同步赔率 ────────────────────────────────────────────────
echo ""
echo "▶ Step 1: 同步实时赔率..."
ODDS_RESULT=$(curl -s -X POST \
  "$SUPABASE_URL/functions/v1/sync-odds" \
  -H "Authorization: Bearer $SERVICE_KEY" \
  -H "Content-Type: application/json")

SYNCED=$(echo "$ODDS_RESULT" | python3 -c "import json,sys; d=json.load(sys.stdin); print(d.get('synced',0))" 2>/dev/null || echo "?")
echo "  ✅ 赔率同步完成: $SYNCED 场"

# ── Step 2: 拉已完赛结果 ────────────────────────────────────────────
echo ""
echo "▶ Step 2: 拉最新比赛结果..."
MATCHES_JSON=$(curl -s \
  "https://api.football-data.org/v4/competitions/WC/matches?season=2026&status=FINISHED" \
  -H "X-Auth-Token: $FOOTBALL_DATA_KEY")

FINISHED_COUNT=$(echo "$MATCHES_JSON" | python3 -c "import json,sys; print(json.load(sys.stdin)['resultSet']['count'])" 2>/dev/null || echo "0")
echo "  📊 football-data.org 返回已完赛: $FINISHED_COUNT 场"

# ── Step 3: 用 Python 匹配并更新 ────────────────────────────────────
echo ""
echo "▶ Step 3: 更新数据库结果..."

# 把 JSON 写到临时文件，避免 heredoc stdin 冲突
TMPFILE=$(mktemp /tmp/wc_matches_XXXXXX.json)
echo "$MATCHES_JSON" > "$TMPFILE"

python3 - "$TMPFILE" <<'PYEOF'
import sys
MATCHES_FILE = sys.argv[1]
import json, sys, urllib.request, urllib.error

SUPABASE_URL = "https://cxiwxtbbyuajribyzalu.supabase.co"
SERVICE_KEY  = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN4aXd4dGJieXVhanJpYnl6YWx1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDkxNDc5OCwiZXhwIjoyMDk2NDkwNzk4fQ.MFv1VRDIwWcXy0X8nqxrQnYFwfHFaKsvgglXiZ3orEA"

# football-data team name → 我们DB的 team_id
TEAM_MAP = {
    "mexico": 16, "south korea": 17, "korea republic": 17,
    "canada": 5529, "france": 2, "belgium": 1, "croatia": 3,
    "brazil": 6, "uruguay": 7, "spain": 9, "england": 10,
    "japan": 12, "senegal": 13, "serbia": 14, "switzerland": 15,
    "south africa": 9000001, "czechia": 9000002, "czech republic": 9000002,
    "bosniaherzegovina": 9000003, "bosnia-herzegovina": 9000003, "bosnia herzegovina": 9000003,
    "haiti": 9000004, "scotland": 9000005, "paraguay": 9000006,
    "turkey": 9000007, "turkiye": 9000007,
    "curacao": 9000008, "ivory coast": 9000009, "sweden": 9000010,
    "new zealand": 9000011, "cape verde": 9000012, "cape verde islands": 9000012, "iraq": 9000013,
    "norway": 9000014, "algeria": 9000015, "austria": 9000016,
    "jordan": 9000017, "uzbekistan": 9000018, "colombia": 9000019,
    "dr congo": 9000020, "congo dr": 9000020, "democratic republic of congo": 9000020, "democratic republic congo": 9000020,
    "panama": 9000021, "egypt": 9000022,
    "australia": 20, "denmark": 21, "iran": 22, "saudi arabia": 23,
    "poland": 24, "germany": 25, "argentina": 26, "portugal": 27,
    "tunisia": 28, "costa rica": 29, "morocco": 31,
    "netherlands": 1118, "ghana": 1504, "cameroon": 1530,
    "qatar": 1569, "ecuador": 2382, "usa": 2384, "united states": 2384,
    "wales": 767,
}

def normalize(name):
    import re, unicodedata
    name = unicodedata.normalize('NFKD', name)
    name = name.encode('ascii', 'ignore').decode('ascii')
    return re.sub(r'\s+', ' ', re.sub(r'[^a-z\s]', '', name.lower())).strip()

def get_team_id(name):
    return TEAM_MAP.get(normalize(name))

def api(method, path, body=None):
    url = SUPABASE_URL + path
    headers = {
        "apikey": SERVICE_KEY,
        "Authorization": f"Bearer {SERVICE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "return=minimal",
    }
    data = json.dumps(body).encode() if body else None
    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req) as r:
            return r.status
    except urllib.error.HTTPError as e:
        return e.code

# 拉我们DB里所有tier=1的比赛
req = urllib.request.Request(
    SUPABASE_URL + "/rest/v1/matches?select=id,home_team_id,away_team_id,status,home_score,away_score&tier=eq.1&limit=200",
    headers={"apikey": SERVICE_KEY, "Authorization": f"Bearer {SERVICE_KEY}"}
)
with urllib.request.urlopen(req) as r:
    db_matches = json.load(r)

# 建立 (home_id, away_id) → match_id 的索引
lookup = {}
for m in db_matches:
    lookup[(m['home_team_id'], m['away_team_id'])] = m

# 读临时文件
with open(MATCHES_FILE) as f:
    data = json.load(f)
updated = 0
skipped = []

for m in data['matches']:
    home_name = m['homeTeam']['name']
    away_name = m['awayTeam']['name']
    home_id = get_team_id(home_name)
    away_id = get_team_id(away_name)
    score = m['score']['fullTime']

    if not home_id or not away_id:
        skipped.append(f"  ⚠️  找不到队伍ID: {home_name} vs {away_name}")
        continue

    db_m = lookup.get((home_id, away_id))
    if not db_m:
        skipped.append(f"  ⚠️  DB无此场次: {home_name}({home_id}) vs {away_name}({away_id})")
        continue

    # 已经是正确结果就跳过
    if (db_m['status'] == 'finished'
            and db_m['home_score'] == score['home']
            and db_m['away_score'] == score['away']):
        continue

    status = api("PATCH",
        f"/rest/v1/matches?id=eq.{db_m['id']}",
        {"status": "finished", "home_score": score['home'], "away_score": score['away']}
    )
    print(f"  ✅ {home_name} {score['home']}-{score['away']} {away_name}  (id={db_m['id']})")
    updated += 1

for s in skipped:
    print(s)

print(f"\n  共更新 {updated} 场结果")
PYEOF
rm -f "$TMPFILE"

echo ""
echo "========================================"
echo " 更新完成！刷新 wc.sugaryu.xyz 查看"
echo "========================================"
