const fs = require('fs');

// 🔴 โดเมนด่านหน้าของคุณ
const BASE_ORIGIN = "https://ikuyikuysas.dufreeapi.uk"; 

// 🌟 ฟังก์ชันเข้ารหัส Base64 (แก้บั๊กให้เข้ารหัส URL เพียวๆ ตรงกับ Worker หลัก)
function encodeBase64Proxy(str) {
    return Buffer.from(encodeURIComponent(str)).toString('base64');
}

function protectPlaylistUrls(jsonObj) {
    function processGroups(groups) {
        if (!Array.isArray(groups)) return;
        groups.forEach(g => {
            if (g.stations && Array.isArray(g.stations)) {
                g.stations.forEach(s => {
                    
                    // 🚀 [หัวใจสำคัญแก้แอปค้าง] ล้างขยะที่ทำให้ Wiseplay เอ๋อตอนเจอลิ้งก์ 302 Redirect
                    // การลบค่าเหล่านี้ออก จะจำลองการทำงานให้เหมือนกับตอนที่คุณ "ก๊อปปี้ URL ไปวางสดๆ" 
                    delete s.playInNatPlayer;
                    delete s.referer;
                    delete s.userAgent;
                    delete s.headers;

                    // เข้ารหัสลิ้งก์เป็น Base64
                    if (s.url && s.url.startsWith("http") && !s.url.includes("/play.m3u8?t=")) {
                        s.url = `${BASE_ORIGIN}/play.m3u8?t=${encodeBase64Proxy(s.url)}`;
                    }
                });
            }
            if (g.groups && Array.isArray(g.groups)) {
                processGroups(g.groups);
            }
        });
    }

    if (jsonObj && jsonObj.groups) {
        processGroups(jsonObj.groups);
    }
    return jsonObj;
}

function processFile(inputFile, outputFile) {
    if (fs.existsSync(inputFile)) {
        console.log(`⏳ กำลังอ่านไฟล์ ${inputFile}...`);
        const rawData = fs.readFileSync(inputFile, 'utf8');
        const parsedData = JSON.parse(rawData);

        console.log(`🔒 กำลังเข้ารหัสลิ้งก์และล้างขยะสำหรับ ${inputFile}...`);
        const protectedData = protectPlaylistUrls(parsedData);

        console.log(`💾 กำลังบันทึกไฟล์ ${outputFile}...`);
        fs.writeFileSync(outputFile, JSON.stringify(protectedData));
        console.log(`✅ ประมวลผล ${outputFile} สำเร็จ!`);
    } else {
        console.log(`⚠️ ไม่พบไฟล์ ${inputFile} ข้ามการทำงาน`);
    }
}

try {
    processFile('raw_filmhub.json', 'filmhub.json');
    processFile('raw_serieshub.json', 'serieshub.json');
    console.log("🎉 เสร็จสิ้นทั้งหมด!");
} catch (error) {
    console.error("❌ เกิดข้อผิดพลาด:", error.message);
    process.exit(1);
}
