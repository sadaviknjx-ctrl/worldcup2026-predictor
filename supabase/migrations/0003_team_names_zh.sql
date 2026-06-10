-- Update Chinese names and flag emojis for all 2026 WC teams
-- Safe to re-run (update only, no insert/delete)

-- ── Existing teams from 2022 WC (API-Football IDs in DB) ─────────────────────
update teams set name_zh = '卡塔尔',    flag_emoji = '🇶🇦' where name ilike '%qatar%';
update teams set name_zh = '厄瓜多尔',  flag_emoji = '🇪🇨' where name ilike '%ecuador%';
update teams set name_zh = '塞内加尔',  flag_emoji = '🇸🇳' where name ilike '%senegal%';
update teams set name_zh = '荷兰',      flag_emoji = '🇳🇱' where name ilike '%netherlands%';
update teams set name_zh = '英格兰',    flag_emoji = '🏴󠁧󠁢󠁥󠁮󠁧󠁿' where name ilike '%england%';
update teams set name_zh = '伊朗',      flag_emoji = '🇮🇷' where name ilike '%iran%';
update teams set name_zh = '美国',      flag_emoji = '🇺🇸' where name ilike '%united states%' or name ilike '%usa%';
update teams set name_zh = '威尔士',    flag_emoji = '🏴󠁧󠁢󠁷󠁬󠁳󠁿' where name ilike '%wales%';
update teams set name_zh = '阿根廷',    flag_emoji = '🇦🇷' where name ilike '%argentina%';
update teams set name_zh = '沙特阿拉伯',flag_emoji = '🇸🇦' where name ilike '%saudi%';
update teams set name_zh = '墨西哥',    flag_emoji = '🇲🇽' where name ilike '%mexico%';
update teams set name_zh = '波兰',      flag_emoji = '🇵🇱' where name ilike '%poland%';
update teams set name_zh = '法国',      flag_emoji = '🇫🇷' where name ilike '%france%';
update teams set name_zh = '澳大利亚',  flag_emoji = '🇦🇺' where name ilike '%australia%';
update teams set name_zh = '丹麦',      flag_emoji = '🇩🇰' where name ilike '%denmark%';
update teams set name_zh = '突尼斯',    flag_emoji = '🇹🇳' where name ilike '%tunisia%';
update teams set name_zh = '西班牙',    flag_emoji = '🇪🇸' where name ilike '%spain%';
update teams set name_zh = '哥斯达黎加',flag_emoji = '🇨🇷' where name ilike '%costa rica%';
update teams set name_zh = '德国',      flag_emoji = '🇩🇪' where name ilike '%germany%';
update teams set name_zh = '日本',      flag_emoji = '🇯🇵' where name ilike '%japan%';
update teams set name_zh = '比利时',    flag_emoji = '🇧🇪' where name ilike '%belgium%';
update teams set name_zh = '加拿大',    flag_emoji = '🇨🇦' where name ilike '%canada%';
update teams set name_zh = '摩洛哥',    flag_emoji = '🇲🇦' where name ilike '%morocco%';
update teams set name_zh = '克罗地亚',  flag_emoji = '🇭🇷' where name ilike '%croatia%';
update teams set name_zh = '巴西',      flag_emoji = '🇧🇷' where name ilike '%brazil%';
update teams set name_zh = '塞尔维亚',  flag_emoji = '🇷🇸' where name ilike '%serbia%';
update teams set name_zh = '瑞士',      flag_emoji = '🇨🇭' where name ilike '%switzerland%';
update teams set name_zh = '喀麦隆',    flag_emoji = '🇨🇲' where name ilike '%cameroon%';
update teams set name_zh = '葡萄牙',    flag_emoji = '🇵🇹' where name ilike '%portugal%';
update teams set name_zh = '加纳',      flag_emoji = '🇬🇭' where name ilike '%ghana%';
update teams set name_zh = '乌拉圭',    flag_emoji = '🇺🇾' where name ilike '%uruguay%';
update teams set name_zh = '韩国',      flag_emoji = '🇰🇷' where name ilike '%korea%';

-- ── New teams (synthetic IDs 9000001–9000022) ─────────────────────────────────
update teams set name_zh = '南非',          flag_emoji = '🇿🇦' where id = 9000001;
update teams set name_zh = '捷克',          flag_emoji = '🇨🇿' where id = 9000002;
update teams set name_zh = '波黑',          flag_emoji = '🇧🇦' where id = 9000003;
update teams set name_zh = '海地',          flag_emoji = '🇭🇹' where id = 9000004;
update teams set name_zh = '苏格兰',        flag_emoji = '🏴󠁧󠁢󠁳󠁣󠁴󠁿' where id = 9000005;
update teams set name_zh = '巴拉圭',        flag_emoji = '🇵🇾' where id = 9000006;
update teams set name_zh = '土耳其',        flag_emoji = '🇹🇷' where id = 9000007;
update teams set name_zh = '库拉索',        flag_emoji = '🇨🇼' where id = 9000008;
update teams set name_zh = '科特迪瓦',      flag_emoji = '🇨🇮' where id = 9000009;
update teams set name_zh = '瑞典',          flag_emoji = '🇸🇪' where id = 9000010;
update teams set name_zh = '新西兰',        flag_emoji = '🇳🇿' where id = 9000011;
update teams set name_zh = '佛得角',        flag_emoji = '🇨🇻' where id = 9000012;
update teams set name_zh = '伊拉克',        flag_emoji = '🇮🇶' where id = 9000013;
update teams set name_zh = '挪威',          flag_emoji = '🇳🇴' where id = 9000014;
update teams set name_zh = '阿尔及利亚',    flag_emoji = '🇩🇿' where id = 9000015;
update teams set name_zh = '奥地利',        flag_emoji = '🇦🇹' where id = 9000016;
update teams set name_zh = '约旦',          flag_emoji = '🇯🇴' where id = 9000017;
update teams set name_zh = '乌兹别克斯坦',  flag_emoji = '🇺🇿' where id = 9000018;
update teams set name_zh = '哥伦比亚',      flag_emoji = '🇨🇴' where id = 9000019;
update teams set name_zh = '刚果民主共和国',flag_emoji = '🇨🇩' where id = 9000020;
update teams set name_zh = '巴拿马',        flag_emoji = '🇵🇦' where id = 9000021;
update teams set name_zh = '埃及',          flag_emoji = '🇪🇬' where id = 9000022;
