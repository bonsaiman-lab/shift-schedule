// GoogleスプレッドシートのCSV公開URL
const CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSIPeA6JsXKM9vSkm6XufICqsQKUjWlfOn17GrbYMPkoou8SPCMzm71V8OsDal6z3xod7c4j1R6ZHTV/pub?gid=0&single=true&output=csv';

let allData = [];

// CSVを取得してパース
async function fetchAndRender() {
    const res = await fetch(CSV_URL);
    const csvText = await res.text();
    allData = parseCSV(csvText);
    renderFilters();
    renderTable();
}

// 簡易CSVパーサ
function parseCSV(csv) {
    const lines = csv.split(/\r?\n/).filter(line => line.trim() !== '');
    const headers = lines[0].split(',');
    return lines.slice(1).map(line => {
        // カンマ区切り（ダブルクオート未対応の簡易版）
        const cols = line.split(',');
        return {
            Date: cols[0],
            Slot: cols[1],
            Staff: cols[2],
            Notes: cols[3] || ''
        };
    });
}

function renderFilters() {
    // 日付フィルタ
    const dateSet = new Set(allData.map(row => row.Date));
    const dateFilter = document.getElementById('dateFilter');
    dateFilter.innerHTML = '<option value="">すべて</option>' +
        Array.from(dateSet).sort().map(date => `<option value="${date}">${date}</option>`).join('');
    // スタッフ名フィルタ
    let staffList = [];
    allData.forEach(row => {
        row.Staff.split(',').forEach(name => {
            const n = name.trim();
            if(n) staffList.push(n);
        });
    });
    const staffSet = new Set(staffList);
    const staffFilter = document.getElementById('staffFilter');
    staffFilter.innerHTML = '<option value="">すべて</option>' +
        Array.from(staffSet).sort().map(staff => `<option value="${staff}">${staff}</option>`).join('');
}

function getJapaneseWeekday(dateStr) {
    const week = ["日", "月", "火", "水", "木", "金", "土"];
    const d = new Date(dateStr);
    if (isNaN(d)) return "";
    return week[d.getDay()];
}

function formatDateWithoutYear(dateStr) {
    // "2025-08-27" や "2025/8/7" や "2025/08/07" → "08/07"
    let m = dateStr.match(/^\d{4}[-\/](\d{1,2})[-\/](\d{1,2})$/);
    if (!m) return dateStr;
    const mm = m[1].padStart(2, '0');
    const dd = m[2].padStart(2, '0');
    return `${mm}/${dd}`;
}

function toDateObj(dateStr) {
    // "2025/08/17" or "2025-08-17" → Dateオブジェクト
    return new Date(dateStr.replace(/-/g, '/'));
}

function renderTable() {
    const dateVal = document.getElementById('dateFilter').value;
    const staffVal = document.getElementById('staffFilter').value;
    const tbody = document.querySelector('#shiftTable tbody');
    tbody.innerHTML = '';

    // 今日の日付（00:00:00で比較）
    const today = new Date();
    today.setHours(0,0,0,0);

    allData.forEach(row => {
        if (row.Date) {
            const rowDate = toDateObj(row.Date);
            if (rowDate < today) return; // 過去日は非表示
        }
        // フィルタ処理
        if(dateVal && row.Date !== dateVal) return;
        if(staffVal && !row.Staff.split(',').map(n => n.trim()).includes(staffVal)) return;
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${formatDateWithoutYear(row.Date)}（${getJapaneseWeekday(row.Date)}）</td>
            <td>${row.Slot}</td>
            <td>${row.Staff}</td>
            <td>${row.Notes || ''}</td>
        `;
        tbody.appendChild(tr);
    });
}

document.getElementById('dateFilter').addEventListener('change', renderTable);
document.getElementById('staffFilter').addEventListener('change', renderTable);

document.getElementById('todayBtn').addEventListener('click', () => {
    const today = new Date();
    today.setHours(0,0,0,0);
    const yyyy = today.getFullYear();
    const mm = ('0' + (today.getMonth() + 1)).slice(-2);
    const dd = ('0' + today.getDate()).slice(-2);
    const todayStr = `${yyyy}/${mm}/${dd}`;
    setDateFilterTo(todayStr);
});
document.getElementById('tomorrowBtn').addEventListener('click', () => {
    const today = new Date();
    today.setHours(0,0,0,0);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    const yyyy = tomorrow.getFullYear();
    const mm = ('0' + (tomorrow.getMonth() + 1)).slice(-2);
    const dd = ('0' + tomorrow.getDate()).slice(-2);
    const tomorrowStr = `${yyyy}/${mm}/${dd}`;
    setDateFilterTo(tomorrowStr);
});

function setDateFilterTo(dateStr) {
    const dateFilter = document.getElementById('dateFilter');
    let found = false;
    for (const option of dateFilter.options) {
        if (option.value === dateStr) {
            dateFilter.value = dateStr;
            found = true;
            break;
        }
    }
    if (!found) {
        dateFilter.value = '';
    }
    renderTable();
}
// 初期化
fetchAndRender();
