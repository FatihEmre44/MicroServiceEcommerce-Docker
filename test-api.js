/**
 * MicroServiceEcommerce — Uçtan Uca API Testi
 * 
 * Bu script tüm servisleri sırasıyla test eder:
 *   1. Auth Service  → Seller kayıt & login (JWT al)
 *   2. Product Service → Ürün oluştur (RabbitMQ event tetikler)
 *   3. Search Service → Arama, öneri, ürün detayı doğrula
 * 
 * Kullanım: node test-api.js
 * Gereksinim: Node.js 18+ (built-in fetch), tüm servisler Docker ile ayakta
 */

const AUTH_URL = 'http://localhost:3001/api/auth';
const PRODUCT_URL = 'http://localhost:3002/api/products';
const SEARCH_URL = 'http://localhost:3004/api/search';

let passed = 0;
let failed = 0;

function log(icon, msg) {
    console.log(`${icon} ${msg}`);
}

function assert(condition, testName) {
    if (condition) {
        passed++;
        log('✅', testName);
    } else {
        failed++;
        log('❌', testName);
    }
}

async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function request(url, options = {}) {
    const res = await fetch(url, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...options.headers,
        },
        body: options.body ? JSON.stringify(options.body) : undefined,
    });
    const data = await res.json();
    return { status: res.status, data };
}

// ─────────────────────────────────────────
// ANA TEST AKIŞI
// ─────────────────────────────────────────
async function runTests() {
    console.log('\n' + '═'.repeat(50));
    console.log('  MicroService E-Commerce — API Test');
    console.log('═'.repeat(50) + '\n');

    let token = '';
    let productId = '';
    const testEmail = `testseller_${Date.now()}@test.com`;
    const testPassword = 'Test1234!';
    const productName = `TestÜrün_${Date.now()}`;

    // ──── 1. HEALTH CHECK ────
    console.log('── Health Checks ──');
    try {
        const auth = await fetch('http://localhost:3001/health').catch(() => null);
        assert(auth && auth.ok, 'Auth Service sağlık kontrolü');
    } catch { assert(false, 'Auth Service sağlık kontrolü'); }

    try {
        const prod = await fetch('http://localhost:3002/health').catch(() => null);
        assert(prod && prod.ok, 'Product Service sağlık kontrolü');
    } catch { assert(false, 'Product Service sağlık kontrolü'); }

    try {
        const search = await fetch('http://localhost:3004/health').catch(() => null);
        assert(search && search.ok, 'Search Service sağlık kontrolü');
    } catch { assert(false, 'Search Service sağlık kontrolü'); }

    // ──── 2. AUTH: KAYIT ────
    console.log('\n── Auth Service ──');
    try {
        const reg = await request(`${AUTH_URL}/register`, {
            method: 'POST',
            body: {
                username: `testseller_${Date.now()}`,
                email: testEmail,
                password: testPassword,
                role: 'seller'
            }
        });
        assert(reg.status === 201 || reg.status === 200, `Seller kayıt (${reg.status})`);
    } catch (err) {
        assert(false, `Seller kayıt — HATA: ${err.message}`);
    }

    // ──── 3. AUTH: GİRİŞ ────
    try {
        const login = await request(`${AUTH_URL}/login`, {
            method: 'POST',
            body: {
                email: testEmail,
                password: testPassword
            }
        });
        token = login.data.token || '';
        assert(login.status === 200 && token, `Seller login & JWT token alındı`);
    } catch (err) {
        assert(false, `Seller login — HATA: ${err.message}`);
    }

    if (!token) {
        log('🛑', 'Token alınamadı, testler durduruluyor.');
        return printSummary();
    }

    // ──── 4. PRODUCT: ÜRÜN OLUŞTUR ────
    console.log('\n── Product Service ──');
    try {
        const create = await request(`${PRODUCT_URL}`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` },
            body: {
                name: productName,
                description: 'Bu bir test ürünüdür. Arama test açıklaması.',
                price: 99.99,
                stock: 50,
                category: 'Elektronik',
                images: ['https://via.placeholder.com/150']
            }
        });
        productId = create.data._id || '';
        assert(create.status === 201 && productId, `Ürün oluşturuldu (id: ${productId})`);
    } catch (err) {
        assert(false, `Ürün oluşturma — HATA: ${err.message}`);
    }

    if (!productId) {
        log('🛑', 'Ürün oluşturulamadı, testler durduruluyor.');
        return printSummary();
    }

    // ──── 5. RABBITMQ EVENT PROPAGATION BEKLEMESİ ────
    console.log('\n⏳ RabbitMQ → Search Service event yayılımı bekleniyor (4sn)...');
    await sleep(4000);

    // ──── 6. SEARCH: ARAMA TESTİ ────
    console.log('\n── Search Service ──');
    try {
        // Anahtar kelime ile arama
        const keyword = productName.substring(0, 8);
        const search = await request(`${SEARCH_URL}?q=${encodeURIComponent(keyword)}`);
        const found = search.data.products && search.data.products.length > 0;
        assert(found, `Arama sonucu bulundu (q="${keyword}", sonuç: ${search.data.products?.length || 0})`);
    } catch (err) {
        assert(false, `Arama testi — HATA: ${err.message}`);
    }

    // ──── 7. SEARCH: KATEGORİ FİLTRESİ ────
    try {
        const catSearch = await request(`${SEARCH_URL}?category=Elektronik`);
        const found = catSearch.data.products && catSearch.data.products.length > 0;
        assert(found, `Kategori filtresi çalışıyor (kategori: Elektronik, sonuç: ${catSearch.data.products?.length || 0})`);
    } catch (err) {
        assert(false, `Kategori filtresi — HATA: ${err.message}`);
    }

    // ──── 8. SEARCH: FİYAT FİLTRESİ ────
    try {
        const priceSearch = await request(`${SEARCH_URL}?minPrice=50&maxPrice=150`);
        const found = priceSearch.data.products && priceSearch.data.products.length > 0;
        assert(found, `Fiyat filtresi çalışıyor (50-150₺, sonuç: ${priceSearch.data.products?.length || 0})`);
    } catch (err) {
        assert(false, `Fiyat filtresi — HATA: ${err.message}`);
    }

    // ──── 9. SEARCH: ÖNERİ (AUTOCOMPLETE) ────
    try {
        const prefix = productName.substring(0, 4).toLowerCase();
        const suggest = await request(`${SEARCH_URL}/suggestions?q=${encodeURIComponent(prefix)}`);
        const hasSuggestions = suggest.data.suggestions && suggest.data.suggestions.length > 0;
        assert(hasSuggestions, `Autocomplete çalışıyor (q="${prefix}", öneri: ${suggest.data.suggestions?.length || 0})`);
    } catch (err) {
        assert(false, `Autocomplete — HATA: ${err.message}`);
    }

    // ──── 10. SEARCH: ÜRÜN DETAY ────
    try {
        const detail = await request(`${SEARCH_URL}/product/${productId}`);
        assert(detail.status === 200 && detail.data.id, `Ürün detayı alındı (id: ${detail.data.id})`);
        assert(detail.data.name === productName, `Ürün ismi doğru: "${detail.data.name}"`);
        assert(detail.data.price === 99.99, `Ürün fiyatı doğru: ${detail.data.price}₺`);
    } catch (err) {
        assert(false, `Ürün detayı — HATA: ${err.message}`);
    }

    // ──── 11. PRODUCT SERVICE: MEVCUT ÜRÜNLER ────
    console.log('\n── Product Service (Doğrulama) ──');
    try {
        const allProducts = await request(`${PRODUCT_URL}`);
        assert(allProducts.status === 200, `Product Service ürün listesi (${allProducts.data.pagination?.total || 0} ürün)`);
    } catch (err) {
        assert(false, `Product listesi — HATA: ${err.message}`);
    }

    printSummary();
}

function printSummary() {
    console.log('\n' + '═'.repeat(50));
    console.log(`  SONUÇ: ${passed} geçti, ${failed} kaldı`);
    console.log('═'.repeat(50));

    if (failed === 0) {
        console.log('🎉 Tüm testler başarılı! Proje hazır.\n');
    } else {
        console.log('⚠️  Bazı testler başarısız. Logları kontrol edin.\n');
    }
    process.exit(failed > 0 ? 1 : 0);
}

// Çalıştır
runTests().catch(err => {
    console.error('💥 Beklenmeyen hata:', err);
    process.exit(1);
});
