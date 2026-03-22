/**
 * 探究テーマ 検索・自動フィルタ生成システム
 */

// HTML要素の取得
const themeList = document.getElementById('theme-list');
const noResult = document.getElementById('no-result');
const themeCount = document.getElementById('theme-count');

// フィルター要素
const filters = {
    keyword: document.getElementById('f-keyword'),
    genre: document.getElementById('f-genre'),
    grade: document.getElementById('f-grade'),
    year: document.getElementById('f-year'),
    course: document.getElementById('f-course'),
    school: document.getElementById('f-school')
};

const randomBtn = document.getElementById('random-btn');
const randomCountInput = document.getElementById('r-count');

/**
 * 1. フィルターの選択肢をデータから自動生成する
 */
function initFilters() {
    const filterKeys = {
        genre: '分野',
        grade: '学年',
        year: '年度',
        course: '授業名'
    };

    Object.keys(filterKeys).forEach(key => {
        const selectEl = filters[key];
        if (!selectEl) return;

        const uniqueValues = [...new Set(THEME_DATABASE.map(item => item[key]))].sort();

        uniqueValues.forEach(val => {
            if (!val) return;
            const option = document.createElement('option');
            option.value = val;
            option.textContent = (key === 'year') ? `${val}` : val;
            selectEl.appendChild(option);
        });
    });
}

/**
 * 2. カードの表示生成
 */
function renderThemes(dataList) {
    themeList.innerHTML = '';
    
    // ---件数表示の更新ロジック ---
    const totalCount = THEME_DATABASE.length;
    const currentCount = dataList.length;
    themeCount.textContent = `全 ${totalCount} 件中 ${currentCount} 件を表示しています`;
    // ---------------------------

    if (dataList.length === 0) {
        noResult.style.display = 'block';
        return;
    }
    
    noResult.style.display = 'none';

    dataList.forEach(item => {
        const card = document.createElement('div');
        card.className = 'c-card';
        card.innerHTML = `
            <span class="c-card__title">${item.title}</span>
            <div class="p-theme-meta">
                <span><strong>分野：</strong>${item.genre}</span>
                <br>
                <span><strong>学校：</strong>${item.school} (${item.year})</span>
                <br>
                <span><strong>対象：</strong>${item.grade} / ${item.course}</span>
            </div>
        `;
        themeList.appendChild(card);
    });
}

/**
 * 3. フィルタリング実行
 */
function applyFilters() {
    const query = {
        keyword: filters.keyword.value.toLowerCase(),
        genre: filters.genre.value,
        grade: filters.grade.value,
        year: filters.year.value,
        course: filters.course.value,
        school: filters.school.value.toLowerCase()
    };

    const result = THEME_DATABASE.filter(item => {
        return (
            (item.title.toLowerCase().includes(query.keyword)) &&
            (query.genre === "" || item.genre === query.genre) &&
            (query.grade === "" || item.grade === query.grade) &&
            (query.year === "" || item.year === query.year) &&
            (query.course === "" || item.course === query.course) &&
            (item.school.toLowerCase().includes(query.school))
        );
    });

    renderThemes(result);
}

/**
 * 4. ランダム表示
 */
function handleRandom() {
    Object.values(filters).forEach(f => f.value = "");
    
    const count = parseInt(randomCountInput.value) || 3;
    const shuffled = [...THEME_DATABASE].sort(() => 0.5 - Math.random());
    
    renderThemes(shuffled.slice(0, count));
}

// --- イベント登録と初期実行 ---
initFilters();

Object.values(filters).forEach(el => {
    const eventType = el.tagName === 'SELECT' ? 'change' : 'input';
    el.addEventListener(eventType, applyFilters);
});

randomBtn.addEventListener('click', handleRandom);

// 初期表示
renderThemes(THEME_DATABASE);