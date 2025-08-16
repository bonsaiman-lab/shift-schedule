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

function renderTable() {
    const dateVal = document.getElementById('dateFilter').value;
    const staffVal = document.getElementById('staffFilter').value;
    const tbody = document.querySelector('#shiftTable tbody');
    tbody.innerHTML = '';

    // 今日の日付（YYYY-MM-DD形式）
    const today = '2025-08-16';

    allData.forEach(row => {
        // 日付が今日より前なら非表示（文字列比較）
        if (row.Date && row.Date < today) return;
        // フィルタ処理
        if(dateVal && row.Date !== dateVal) return;
        if(staffVal && !row.Staff.split(',').map(n => n.trim()).includes(staffVal)) return;
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${row.Date}（${getJapaneseWeekday(row.Date)}）</td>
            <td>${row.Slot}</td>
            <td>${row.Staff}</td>
            <td>${row.Notes || ''}</td>
        `;
        tbody.appendChild(tr);
    });
}

document.getElementById('dateFilter').addEventListener('change', renderTable);
document.getElementById('staffFilter').addEventListener('change', renderTable);

// 初期化
fetchAndRender();
