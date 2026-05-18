const fs = require('fs');

// 🔴 คืนค่ากลับไปใช้โดเมนและ Proxy เดิมที่ทำงานได้สมบูรณ์ 100%
const BASE_ORIGIN = "https://ikuyikuysas.dufreeapi.uk"; 

// 🌟 รูปแบบการเข้ารหัส Base64 เดียวกับตัวอย่างที่คุณส่งมาเป๊ะๆ 
// (URL -> encodeURIComponent -> Base64 -> ตัด = ท้ายสุดออก)
function encodeBase64Proxy(str) {
    let b64 = Buffer.from(encodeURIComponent(str)).toString('base64');
    return b64.replace(/=+$/, ''); 
}

function protectPlaylistUrls(jsonObj) {
    
    // ถอนรากถอนโคนคำสั่ง Native Player เพื่อป้องกันเครื่องเล่นค้างตอนเจอลิ้งก์ Redirect
    if (jsonObj.hasOwnProperty('playInNatPlayer')) {
        delete jsonObj.playInNatPlayer;
    }

    function processGroups(groups) {
        if (!Array.isArray(groups)) return;
        groups.forEach(g => {
            
            if (g.hasOwnProperty('playInNatPlayer')) {
                delete g.playInNatPlayer;
            }

            if (g.stations && Array.isArray(g.stations)) {
                g.stations.forEach(s => {
                    
                    if (s.hasOwnProperty('playInNatPlayer')) {
                        delete s.playInNatPlayer;
                    }
                    
                    // 🌟 คืนค่ากลับไปใช้พารามิเตอร์ ?u= ตามระบบเดิมที่เคยอ่านได้
                    if (s.url && s.url.startsWith("http") && !s.url.includes("/play.m3u8?")) {
                        s.url = `${BASE_ORIGIN}/play.m3u8?u=${encodeBase64Proxy(s.url)}`;
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

        console.log(`🔒 กำลังเข้ารหัสลิ้งก์สำหรับ ${inputFile}...`);
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
