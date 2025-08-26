// GoogleスプレッドシートのCSV公開URL
const CSV_URL = 'https://script.google.com/macros/s/AKfycbw6wyrua7_Pnrr9cBE9Jetjxze9xCwJ7hoHImJPLYjdu8CFlYifk8yg7uWNmq-eKlUCmg/exec';

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
        // カンマ区切り＋各セルのダブルクオート除去
        const cols = line.split(',').map(cell => cell.replace(/^"|"$/g, ''));
        return {
            Date: cols[0],
            Slot: cols[1],
            Staff: cols[2],
            Notes: cols[3] || ''
        };
    });
}

function renderFilters() {
    // 日付フィルタ（日本式表示、過去日除外）
    const today = new Date();
    today.setHours(0,0,0,0);
    const dateSet = new Set();
    allData.forEach(row => {
        const d = toDateObj(row.Date);
        if (!isNaN(d) && d >= today) {
            dateSet.add(row.Date);
        }
    });
    const dateFilter = document.getElementById('dateFilter');
    dateFilter.innerHTML = '<option value="">すべて</option>' +
        Array.from(dateSet)
            .sort((a, b) => toDateObj(a) - toDateObj(b)) // 日付の昇順でソート
            .map(date => {
                const display = `${formatDateWithoutYear(date)}（${getJapaneseWeekday(date)}）`;
                return `<option value="${date}">${display}</option>`;
            }).join('');
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
    // すでにDateオブジェクトならそのまま返す
    if (dateStr instanceof Date) return dateStr;
    // "YYYY/MM/DD" or "YYYY-MM-DD" or 英語Date文字列
    return new Date(dateStr);
}

function formatDateWithoutYear(dateStr) {
    const d = toDateObj(dateStr);
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${mm}/${dd}`;
}

function getJapaneseWeekday(dateStr) {
    const week = ['日', '月', '火', '水', '木', '金', '土'];
    const d = toDateObj(dateStr);
    return week[d.getDay()];
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
        // 日付を日本式に変換して表示
        const displayDate = `${formatDateWithoutYear(row.Date)}（${getJapaneseWeekday(row.Date)}）`;
        tr.innerHTML = `
            <td>${displayDate}</td>
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
    // allDataから今日の日付（生値）を探してフィルタをセット
    const found = allData.find(row => {
        const d = toDateObj(row.Date);
        return !isNaN(d) && d.getTime() === today.getTime();
    });
    if (found) {
        document.getElementById('dateFilter').value = found.Date;
        renderTable();
    }
});

document.getElementById('tomorrowBtn').addEventListener('click', () => {
    const tomorrow = new Date();
    tomorrow.setHours(0,0,0,0);
    tomorrow.setDate(tomorrow.getDate() + 1);
    // allDataから明日の日付（生値）を探してフィルタをセット
    const found = allData.find(row => {
        const d = toDateObj(row.Date);
        return !isNaN(d) && d.getTime() === tomorrow.getTime();
    });
    if (found) {
        document.getElementById('dateFilter').value = found.Date;
        renderTable();
    }
});

document.getElementById('tomorrowBtn').addEventListener('click', () => {
    const tomorrow = new Date();
    tomorrow.setHours(0,0,0,0);
    tomorrow.setDate(tomorrow.getDate() + 1);
    // allDataから明日の日付（生値）を探してフィルタをセット
    const found = allData.find(row => {
        const d = toDateObj(row.Date);
        return !isNaN(d) && d.getTime() === tomorrow.getTime();
    });
    if (found) {
        document.getElementById('dateFilter').value = found.Date;
        renderTable();
    }
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
