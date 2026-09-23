
-- =========================================================
-- UNIVERSITY WEB DATABASE
-- =========================================================

CREATE DATABASE IF NOT EXISTS university_web
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE university_web;

SET NAMES utf8mb4;
SET CHARACTER SET utf8mb4;

-- =========================================================
-- 1. VISITORS
-- =========================================================

CREATE TABLE IF NOT EXISTS visitors (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    status VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)
ENGINE = InnoDB
DEFAULT CHARSET = utf8mb4
COLLATE = utf8mb4_unicode_ci;


-- =========================================================
-- 2. USERS
-- =========================================================
-- can_edit
-- 1 = แก้ไขได้
-- 0 = ดูได้อย่างเดียว
-- =========================================================

CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    saka_path VARCHAR(50) NOT NULL DEFAULT 'all',
    can_edit TINYINT(1) NOT NULL DEFAULT 1
)
ENGINE = InnoDB
DEFAULT CHARSET = utf8mb4
COLLATE = utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS approved_admins (
    id INT AUTO_INCREMENT PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    saka_path VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_approved_admin_name (first_name, last_name)
)
ENGINE = InnoDB
DEFAULT CHARSET = utf8mb4
COLLATE = utf8mb4_unicode_ci;


-- =========================================================
-- SUPER ADMIN เริ่มต้น
-- Username: admintechno
-- กำหนดสิทธิ์เข้าถึงทุกสาขา และแก้ไขข้อมูลได้
-- =========================================================

INSERT IGNORE INTO users (
    username,
    password,
    first_name,
    last_name,
    saka_path,
    can_edit
) VALUES (
    'admintechno',
    'scrypt$e4d7421fd17d12459e4460d04c45cef0$4b0c68b18dda8e4a435c46ee3ec2a6a9ea1645711cd2a0f0e4bf849f3568eb5d7d7913282d1ccddfbdcdf02720925b796ee9114f3058f79f718bc0d87f00911a',
    'Admin',
    'Techno',
    'all',
    1
);



-- =========================================================
-- 3. NEWS
-- =========================================================

CREATE TABLE IF NOT EXISTS news (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    image VARCHAR(500),
    created_by_admin_id INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)
ENGINE = InnoDB
DEFAULT CHARSET = utf8mb4
COLLATE = utf8mb4_unicode_ci;

-- =========================================================
-- 4. APPLICATIONS
-- =========================================================

CREATE TABLE IF NOT EXISTS applications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    major_name VARCHAR(255) NOT NULL,
    fullname VARCHAR(255) NOT NULL,
    old_school VARCHAR(255) NOT NULL,
    education VARCHAR(100) NOT NULL,
    second_major_name VARCHAR(255) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)
ENGINE = InnoDB
DEFAULT CHARSET = utf8mb4
COLLATE = utf8mb4_unicode_ci;


-- =========================================================
-- 5. COURSE INFO
-- =========================================================

DROP TABLE IF EXISTS course_info;

CREATE TABLE course_info (
    id INT AUTO_INCREMENT PRIMARY KEY,
    saka_path VARCHAR(50) NOT NULL UNIQUE,

    faculty_name VARCHAR(255),
    title VARCHAR(255) NOT NULL,
    english_title VARCHAR(255),

    hero_description TEXT,

    about_title VARCHAR(255),
    about_description_1 TEXT,
    about_description_2 TEXT,

    image VARCHAR(500),

    highlights JSON,
    curriculum JSON,
    curriculum_transfer JSON,
    skills JSON,
    careers JSON,

    updated_at TIMESTAMP
        DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP
)
ENGINE = InnoDB
DEFAULT CHARSET = utf8mb4
COLLATE = utf8mb4_unicode_ci;


-- =========================================================
-- 6. COMMON CURRICULUM
-- =========================================================

SET @CURRICULUM_GENERAL = JSON_ARRAY(

    JSON_OBJECT(
        'category',
        '1. หมวดวิชาศึกษาทั่วไป',

        'credits',
        30,

        'subCategories',
        JSON_ARRAY(

            JSON_OBJECT(
                'name',
                'กลุ่มวิชาสังคมศาสตร์',
                'credits',
                3
            ),

            JSON_OBJECT(
                'name',
                'กลุ่มวิชามนุษยศาสตร์',
                'credits',
                3
            ),

            JSON_OBJECT(
                'name',
                'กลุ่มวิชาวิทยาศาสตร์และคณิตศาสตร์',
                'credits',
                6
            ),

            JSON_OBJECT(
                'name',
                'กลุ่มวิชาภาษา',
                'credits',
                12
            ),

            JSON_OBJECT(
                'name',
                'กลุ่มวิชาศึกษาทั่วไปกลุ่มพิเศษ',
                'credits',
                6
            )

        )
    )

);


SET @CURRICULUM_FREE = JSON_OBJECT(
    'category',
    '3. หมวดวิชาเลือกเสรี',

    'credits',
    6,

    'subCategories',
    JSON_ARRAY()
);


-- =========================================================
-- 7. COMPUTER
-- admin01
-- =========================================================

INSERT INTO course_info (
    saka_path,
    faculty_name,
    title,
    english_title,
    hero_description,
    about_title,
    about_description_1,
    about_description_2,
    image,
    highlights,
    curriculum,
    skills,
    careers
)
VALUES (

    'computer',

    'Faculty of Computer Engineering',

    'วิศวกรรมคอมพิวเตอร์',

    'Computer Engineering',

    'เรียนรู้การออกแบบ พัฒนา และประยุกต์ใช้เทคโนโลยีคอมพิวเตอร์ เพื่อสร้างนวัตกรรมและระบบอัจฉริยะที่ตอบโจทย์โลกยุคดิจิทัล',

    'เรียนอะไรในวิศวกรรมคอมพิวเตอร์?',

    'สาขาวิศวกรรมคอมพิวเตอร์มุ่งเน้นการเรียนรู้ทั้งด้านฮาร์ดแวร์และซอฟต์แวร์ ตั้งแต่การออกแบบระบบคอมพิวเตอร์ การเขียนโปรแกรม ระบบเครือข่าย ฐานข้อมูล ปัญญาประดิษฐ์ และเทคโนโลยีสมัยใหม่',

    'นักศึกษาจะได้เรียนรู้ทั้งภาคทฤษฎีและปฏิบัติ พร้อมฝึกคิดวิเคราะห์และแก้ไขปัญหาจากสถานการณ์จริง เพื่อเตรียมความพร้อมสู่การทำงานในอุตสาหกรรมเทคโนโลยีระดับสากล',

    '/image/computer.jpg',

    JSON_ARRAY(

        JSON_OBJECT(
            'image',
            '',
            'title',
            'ซอฟต์แวร์และการพัฒนาโปรแกรม',
            'desc',
            'เรียนรู้การออกแบบและพัฒนาซอฟต์แวร์ เว็บไซต์ แอปพลิเคชัน และระบบสารสนเทศระดับองค์กร'
        ),

        JSON_OBJECT(
            'image',
            '',
            'title',
            'AI และเทคโนโลยีอัจฉริยะ',
            'desc',
            'ศึกษาปัญญาประดิษฐ์ การเรียนรู้ของเครื่อง (Machine Learning) และการประยุกต์ใช้ Data analytics'
        ),

        JSON_OBJECT(
            'image',
            '',
            'title',
            'ระบบเครือข่ายและ IoT',
            'desc',
            'เรียนรู้ระบบเครือข่ายความเร็วสูง อุปกรณ์อัจฉริยะ และ Internet of Things เพื่อเชื่อมต่อโลกดิจิทัล'
        )

    ),

    JSON_ARRAY(

        @CURRICULUM_GENERAL,

        JSON_OBJECT(
            'category',
            '2. หมวดวิชาเฉพาะ',

            'credits',
            102,

            'subCategories',
            JSON_ARRAY(

                JSON_OBJECT(
                    'name',
                    'กลุ่มวิชาวิทยาศาสตร์พื้นฐานและคณิตศาสตร์',
                    'credits',
                    21
                ),

                JSON_OBJECT(
                    'name',
                    'กลุ่มวิชาแกนวิศวกรรมศาสตร์',
                    'credits',
                    18
                ),

                JSON_OBJECT(
                    'name',
                    'กลุ่มวิชาบังคับทางวิศวกรรมคอมพิวเตอร์',
                    'credits',
                    45
                ),

                JSON_OBJECT(
                    'name',
                    'กลุ่มวิชาเลือกทางวิศวกรรมคอมพิวเตอร์',
                    'credits',
                    12
                ),

                JSON_OBJECT(
                    'name',
                    'กลุ่มวิชาฝึกงาน/สหกิจศึกษา (ไม่น้อยกว่า 300 ชั่วโมง)',
                    'credits',
                    6
                )

            )
        ),

        @CURRICULUM_FREE

    ),

    JSON_ARRAY(
        'การเขียนโปรแกรม (C++, Python, JS)',
        'การออกแบบและสถาปัตยกรรมระบบ',
        'การจัดการฐานข้อมูล (SQL / NoSQL)',
        'ระบบเครือข่ายและ Cloud',
        'ปัญญาประดิษฐ์และ ML',
        'ความปลอดภัยไซเบอร์ (Cyber Security)',
        'การประมวลผลแบบ Cloud Computing',
        'ระบบฝังตัวและ Internet of Things'
    ),

    JSON_ARRAY(
        JSON_OBJECT('title', 'Software Engineer', 'icon', '👨‍💻'),
        JSON_OBJECT('title', 'Web / App Developer', 'icon', '🚀'),
        JSON_OBJECT('title', 'AI / ML Engineer', 'icon', '🧠'),
        JSON_OBJECT('title', 'System Engineer', 'icon', '⚙️'),
        JSON_OBJECT('title', 'Network Engineer', 'icon', '📡'),
        JSON_OBJECT('title', 'Cyber Security Specialist', 'icon', '🛡️'),
        JSON_OBJECT('title', 'Data Engineer', 'icon', '📊'),
        JSON_OBJECT('title', 'IoT Developer', 'icon', '🔌')
    )
);


-- =========================================================
-- 8. COMPUTER AI
-- admin02
-- =========================================================

INSERT INTO course_info (
    saka_path,
    faculty_name,
    title,
    english_title,
    hero_description,
    about_title,
    about_description_1,
    about_description_2,
    image,
    highlights,
    curriculum,
    skills,
    careers
)
VALUES (

    'computer-ai',

    'Faculty of Computer Engineering and Artificial Intelligence',

    'คอมพิวเตอร์และปัญญาประดิษฐ์',

    'Computer Engineering and Artificial Intelligence',

    'เรียนรู้เทคโนโลยีคอมพิวเตอร์ ปัญญาประดิษฐ์ และการพัฒนาระบบอัจฉริยะ เพื่อสร้างนวัตกรรมสำหรับโลกยุคดิจิทัล',

    'เรียนอะไรในคอมพิวเตอร์และปัญญาประดิษฐ์?',

    'มุ่งเน้นการเรียนรู้ด้านคอมพิวเตอร์ควบคู่กับปัญญาประดิษฐ์ การเขียนโปรแกรม การเรียนรู้ของเครื่อง การวิเคราะห์ข้อมูล และการพัฒนาระบบอัจฉริยะ',

    'นักศึกษาจะได้เรียนรู้ทั้งภาคทฤษฎีและปฏิบัติ พร้อมพัฒนาทักษะในการสร้างซอฟต์แวร์ ระบบ AI และเทคโนโลยีสมัยใหม่ เพื่อนำไปประยุกต์ใช้ในอุตสาหกรรมจริง',

    '/image/computerAI.jpg',

    JSON_ARRAY(

        JSON_OBJECT(
            'image',
            '',
            'title',
            'Artificial Intelligence',
            'desc',
            'เรียนรู้หลักการและการประยุกต์ใช้ปัญญาประดิษฐ์ เพื่อสร้างระบบอัจฉริยะ'
        ),

        JSON_OBJECT(
            'image',
            '',
            'title',
            'Machine Learning',
            'desc',
            'เรียนรู้การสร้างโมเดลและระบบที่สามารถเรียนรู้จากข้อมูล'
        ),

        JSON_OBJECT(
            'image',
            '',
            'title',
            'Data Science',
            'desc',
            'วิเคราะห์ข้อมูลและนำข้อมูลมาใช้ในการสร้างระบบอัจฉริยะ'
        )

    ),

    JSON_ARRAY(

        @CURRICULUM_GENERAL,

        JSON_OBJECT(
            'category',
            '2. หมวดวิชาเฉพาะ',

            'credits',
            102,

            'subCategories',
            JSON_ARRAY(

                JSON_OBJECT(
                    'name',
                    'กลุ่มวิชาวิทยาศาสตร์พื้นฐานและคณิตศาสตร์',
                    'credits',
                    21
                ),

                JSON_OBJECT(
                    'name',
                    'กลุ่มวิชาแกนวิศวกรรมศาสตร์',
                    'credits',
                    18
                ),

                JSON_OBJECT(
                    'name',
                    'กลุ่มวิชาบังคับทางคอมพิวเตอร์และปัญญาประดิษฐ์',
                    'credits',
                    45
                ),

                JSON_OBJECT(
                    'name',
                    'กลุ่มวิชาเลือกทางคอมพิวเตอร์และปัญญาประดิษฐ์',
                    'credits',
                    12
                ),

                JSON_OBJECT(
                    'name',
                    'กลุ่มวิชาฝึกงาน/สหกิจศึกษา',
                    'credits',
                    6
                )

            )
        ),

        @CURRICULUM_FREE

    ),

    JSON_ARRAY(
        'การเขียนโปรแกรม',
        'Artificial Intelligence',
        'Machine Learning',
        'Deep Learning',
        'Data Science',
        'Computer Vision',
        'Natural Language Processing',
        'Internet of Things'
    ),

    JSON_ARRAY(
        JSON_OBJECT('title', 'AI Engineer', 'icon', '🤖'),
        JSON_OBJECT('title', 'Machine Learning Engineer', 'icon', '🧠'),
        JSON_OBJECT('title', 'Data Scientist', 'icon', '📊'),
        JSON_OBJECT('title', 'AI Developer', 'icon', '💻'),
        JSON_OBJECT('title', 'Software Engineer', 'icon', '👨‍💻'),
        JSON_OBJECT('title', 'Data Engineer', 'icon', '⚙️')
    )
);


-- =========================================================
-- 9. CONSTRUCTION
-- admin03
-- =========================================================

INSERT INTO course_info (
    saka_path,
    faculty_name,
    title,
    english_title,
    hero_description,
    about_title,
    about_description_1,
    about_description_2,
    image,
    highlights,
    curriculum,
    skills,
    careers
)
VALUES (

    'construction',

    'Faculty of Industrial Technology',

    'วิศวกรรมบริหารงานก่อสร้าง',

    'Construction Management Engineering',

    'เรียนรู้การวางแผน ควบคุม และบริหารโครงการก่อสร้าง ตั้งแต่เริ่มต้นจนถึงการส่งมอบงาน',

    'เรียนอะไรในวิศวกรรมบริหารงานก่อสร้าง?',

    'ศึกษาการบริหารโครงการก่อสร้าง การวางแผนงาน การจัดการทรัพยากร และการควบคุมต้นทุนของโครงการ',

    'เน้นการประยุกต์ใช้ความรู้ทางวิศวกรรม ร่วมกับการบริหารจัดการ เพื่อให้งานก่อสร้างมีคุณภาพและตรงตามแผน',

    '/image/construction.jpg',

    JSON_ARRAY(

        JSON_OBJECT(
            'image',
            '',
            'title',
            'การบริหารโครงการ',
            'desc',
            'เรียนรู้การวางแผนและบริหารโครงการก่อสร้าง ตั้งแต่เริ่มต้นจนถึงส่งมอบ'
        ),

        JSON_OBJECT(
            'image',
            '',
            'title',
            'การวางแผนและควบคุม',
            'desc',
            'ควบคุมเวลา ต้นทุน คุณภาพ และทรัพยากรของโครงการ'
        ),

        JSON_OBJECT(
            'image',
            '',
            'title',
            'การจัดการหน้างาน',
            'desc',
            'เรียนรู้การบริหารทีมงาน และการจัดการปัญหาที่เกิดขึ้นในหน้างาน'
        )

    ),

    JSON_ARRAY(

        @CURRICULUM_GENERAL,

        JSON_OBJECT(
            'category',
            '2. หมวดวิชาเฉพาะ',

            'credits',
            102,

            'subCategories',
            JSON_ARRAY(

                JSON_OBJECT(
                    'name',
                    'กลุ่มวิชาวิทยาศาสตร์พื้นฐานและคณิตศาสตร์',
                    'credits',
                    21
                ),

                JSON_OBJECT(
                    'name',
                    'กลุ่มวิชาแกนวิศวกรรมศาสตร์',
                    'credits',
                    18
                ),

                JSON_OBJECT(
                    'name',
                    'กลุ่มวิชาบังคับทางวิศวกรรมบริหารงานก่อสร้าง',
                    'credits',
                    45
                ),

                JSON_OBJECT(
                    'name',
                    'กลุ่มวิชาเลือกทางวิศวกรรมบริหารงานก่อสร้าง',
                    'credits',
                    12
                ),

                JSON_OBJECT(
                    'name',
                    'กลุ่มวิชาฝึกงาน/สหกิจศึกษา (ไม่น้อยกว่า 300 ชั่วโมง)',
                    'credits',
                    6
                )

            )
        ),

        @CURRICULUM_FREE

    ),

    JSON_ARRAY(
        'การบริหารโครงการก่อสร้าง',
        'การวางแผนงานก่อสร้าง',
        'การควบคุมต้นทุน',
        'การควบคุมคุณภาพ',
        'การบริหารทรัพยากร',
        'Construction Technology',
        'การอ่านแบบก่อสร้าง',
        'ความปลอดภัยในงานก่อสร้าง'
    ),

    JSON_ARRAY(
        JSON_OBJECT('title', 'Construction Engineer', 'icon', '🏗️'),
        JSON_OBJECT('title', 'Project Engineer', 'icon', '📋'),
        JSON_OBJECT('title', 'Construction Manager', 'icon', '🏢'),
        JSON_OBJECT('title', 'Site Engineer', 'icon', '👷'),
        JSON_OBJECT('title', 'Project Coordinator', 'icon', '🤝'),
        JSON_OBJECT('title', 'Cost Engineer', 'icon', '💰'),
        JSON_OBJECT('title', 'Planning Engineer', 'icon', '📊'),
        JSON_OBJECT('title', 'Quality Control Engineer', 'icon', '🔍')
    )
);


-- =========================================================
-- 10. DIGITAL
-- admin04
-- =========================================================

INSERT INTO course_info (
    saka_path,
    faculty_name,
    title,
    english_title,
    hero_description,
    about_title,
    about_description_1,
    about_description_2,
    image,
    highlights,
    curriculum,
    skills,
    careers
)
VALUES (

    'digital',

    'Faculty of Industrial Technology',

    'เทคโนโลยีดิจิทัลเพื่อการออกแบบ',

    'Digital Technology for Design',

    'ผสมผสานเทคโนโลยีดิจิทัล การออกแบบ และความคิดสร้างสรรค์ เพื่อสร้างผลงานและนวัตกรรมสำหรับโลกยุคดิจิทัล',

    'เรียนอะไรในสาขานี้?',

    'เรียนรู้การออกแบบด้วยเครื่องมือดิจิทัล การออกแบบกราฟิก การสร้างสื่อ และการประยุกต์ใช้เทคโนโลยี เพื่อสร้างสรรค์ผลงานที่ตอบโจทย์ผู้ใช้งาน',

    'มุ่งเน้นการผสมผสานระหว่างความคิดสร้างสรรค์ด้านศิลปะและการประยุกต์ใช้ซอฟต์แวร์สมัยใหม่ เพื่อก้าวสู่มืออาชีพในสายงานออกแบบดิจิทัล',

    '/image/logo.png',

    JSON_ARRAY(

        JSON_OBJECT(
            'image',
            '',
            'title',
            'Digital Design',
            'desc',
            'ออกแบบสื่อและผลงานดิจิทัลด้วยเครื่องมือที่ทันสมัย ตอบโจทย์ยุคดิจิทัล'
        ),

        JSON_OBJECT(
            'image',
            '',
            'title',
            'Graphic Technology',
            'desc',
            'ใช้เทคโนโลยีเพื่อสร้างสรรค์งานกราฟิกและสื่อดิจิทัลหลากหลายรูปแบบ'
        ),

        JSON_OBJECT(
            'image',
            '',
            'title',
            'Creative Innovation',
            'desc',
            'พัฒนาความคิดสร้างสรรค์และนวัตกรรมการออกแบบเพื่อสร้างมูลค่าเพิ่ม'
        )

    ),

    JSON_ARRAY(

        @CURRICULUM_GENERAL,

        JSON_OBJECT(
            'category',
            '2. หมวดวิชาเฉพาะ',

            'credits',
            102,

            'subCategories',
            JSON_ARRAY(

                JSON_OBJECT(
                    'name',
                    'กลุ่มวิชาวิทยาศาสตร์พื้นฐานและคณิตศาสตร์',
                    'credits',
                    21
                ),

                JSON_OBJECT(
                    'name',
                    'กลุ่มวิชาแกนเทคโนโลยี',
                    'credits',
                    18
                ),

                JSON_OBJECT(
                    'name',
                    'กลุ่มวิชาบังคับทางเทคโนโลยีดิจิทัลเพื่อการออกแบบ',
                    'credits',
                    45
                ),

                JSON_OBJECT(
                    'name',
                    'กลุ่มวิชาเลือกทางเทคโนโลยีดิจิทัลเพื่อการออกแบบ',
                    'credits',
                    12
                ),

                JSON_OBJECT(
                    'name',
                    'กลุ่มวิชาฝึกงาน/สหกิจศึกษา (ไม่น้อยกว่า 300 ชั่วโมง)',
                    'credits',
                    6
                )

            )
        ),

        @CURRICULUM_FREE

    ),

    JSON_ARRAY(
        'Graphic Design',
        'Digital Media',
        '3D Design',
        'UX/UI Design',
        'Motion Graphic',
        'Digital Technology',
        'Creative Design',
        'Presentation Design'
    ),

    JSON_ARRAY(
        JSON_OBJECT('title', 'Graphic Designer', 'icon', '🎨'),
        JSON_OBJECT('title', 'UX/UI Designer', 'icon', '📱'),
        JSON_OBJECT('title', 'Digital Designer', 'icon', '💻'),
        JSON_OBJECT('title', 'Content Creator', 'icon', '🎬'),
        JSON_OBJECT('title', 'Motion Graphic Designer', 'icon', '✨'),
        JSON_OBJECT('title', '3D Designer', 'icon', '🧊'),
        JSON_OBJECT('title', 'Media Designer', 'icon', '🖥️'),
        JSON_OBJECT('title', 'Creative Designer', 'icon', '💡')
    )
);


-- =========================================================
-- 11. ELECTRICAL
-- admin05
-- =========================================================

INSERT INTO course_info (
    saka_path,
    faculty_name,
    title,
    english_title,
    hero_description,
    about_title,
    about_description_1,
    about_description_2,
    image,
    highlights,
    curriculum,
    skills,
    careers
)
VALUES (

    'electrical',

    'Faculty of Industrial Technology',

    'เทคโนโลยีไฟฟ้า',

    'Electrical Technology',

    'เรียนรู้เทคโนโลยีไฟฟ้า ระบบควบคุม ระบบอัตโนมัติ และการประยุกต์ใช้พลังงาน เพื่อรองรับอุตสาหกรรมยุคใหม่',

    'เรียนอะไรในเทคโนโลยีไฟฟ้า?',

    'ศึกษาพื้นฐานและการประยุกต์ใช้ระบบไฟฟ้า ระบบควบคุม เครื่องจักรไฟฟ้า ระบบอัตโนมัติ และเทคโนโลยีที่เกี่ยวข้องกับภาคอุตสาหกรรม',

    'มุ่งเน้นทักษะภาคปฏิบัติและการประยุกต์ใช้เทคโนโลยีสมัยใหม่ เพื่อเตรียมความพร้อมสู่สายงานวิชาชีพด้านไฟฟ้าอย่างแท้จริง',

    '/image/logo.png',

    JSON_ARRAY(

        JSON_OBJECT(
            'image',
            '',
            'title',
            'ระบบไฟฟ้า',
            'desc',
            'เรียนรู้การออกแบบ ติดตั้ง และดูแลระบบไฟฟ้าในอาคารและอุตสาหกรรม'
        ),

        JSON_OBJECT(
            'image',
            '',
            'title',
            'ระบบควบคุม',
            'desc',
            'ศึกษาระบบควบคุม ระบบอัตโนมัติ และเครื่องจักรไฟฟ้าที่ทันสมัย'
        ),

        JSON_OBJECT(
            'image',
            '',
            'title',
            'เทคโนโลยีอุตสาหกรรม',
            'desc',
            'ประยุกต์ใช้เทคโนโลยีไฟฟ้าและพลังงานเพื่อรองรับภาคอุตสาหกรรมยุคใหม่'
        )

    ),

    JSON_ARRAY(

        @CURRICULUM_GENERAL,

        JSON_OBJECT(
            'category',
            '2. หมวดวิชาเฉพาะ',

            'credits',
            102,

            'subCategories',
            JSON_ARRAY(

                JSON_OBJECT(
                    'name',
                    'กลุ่มวิชาวิทยาศาสตร์พื้นฐานและคณิตศาสตร์',
                    'credits',
                    21
                ),

                JSON_OBJECT(
                    'name',
                    'กลุ่มวิชาแกนเทคโนโลยี',
                    'credits',
                    18
                ),

                JSON_OBJECT(
                    'name',
                    'กลุ่มวิชาบังคับทางเทคโนโลยีไฟฟ้า',
                    'credits',
                    45
                ),

                JSON_OBJECT(
                    'name',
                    'กลุ่มวิชาเลือกทางเทคโนโลยีไฟฟ้า',
                    'credits',
                    12
                ),

                JSON_OBJECT(
                    'name',
                    'กลุ่มวิชาฝึกงาน/สหกิจศึกษา (ไม่น้อยกว่า 300 ชั่วโมง)',
                    'credits',
                    6
                )

            )
        ),

        @CURRICULUM_FREE

    ),

    JSON_ARRAY(
        'ระบบไฟฟ้า',
        'วงจรไฟฟ้า',
        'ระบบควบคุม',
        'PLC',
        'ระบบอัตโนมัติ',
        'เครื่องจักรไฟฟ้า',
        'พลังงาน',
        'งานอุตสาหกรรม'
    ),

    JSON_ARRAY(
        JSON_OBJECT('title', 'ช่างไฟฟ้า', 'icon', '⚡'),
        JSON_OBJECT('title', 'วิศวกรระบบควบคุม', 'icon', '⚙️'),
        JSON_OBJECT('title', 'Automation Technician', 'icon', '🤖'),
        JSON_OBJECT('title', 'Electrical Technician', 'icon', '🔌'),
        JSON_OBJECT('title', 'PLC Programmer', 'icon', '💻'),
        JSON_OBJECT('title', 'Maintenance Technician', 'icon', '🔧'),
        JSON_OBJECT('title', 'Control Technician', 'icon', '🎛️'),
        JSON_OBJECT('title', 'Electrical Designer', 'icon', '📐')
    )
);


-- =========================================================
-- 12. ENERGY
-- admin06
-- =========================================================

INSERT INTO course_info (
    saka_path,
    faculty_name,
    title,
    english_title,
    hero_description,
    about_title,
    about_description_1,
    about_description_2,
    image,
    highlights,
    curriculum,
    skills,
    careers
)
VALUES (

    'energy',

    'Faculty of Industrial Technology',

    'วิศวกรรมการจัดการพลังงานในงานอุตสาหกรรม',

    'Industrial Energy Management Engineering',

    'เรียนรู้การบริหารจัดการพลังงาน การอนุรักษ์พลังงาน และการประยุกต์ใช้พลังงานทดแทน เพื่อเพิ่มประสิทธิภาพให้กับภาคอุตสาหกรรม',

    'เรียนอะไรในสาขานี้?',

    'ศึกษาการจัดการพลังงานในภาคอุตสาหกรรม ตั้งแต่การวิเคราะห์การใช้พลังงาน การอนุรักษ์พลังงาน และการเพิ่มประสิทธิภาพระบบ',

    'พร้อมเรียนรู้เทคโนโลยีพลังงานสะอาด และแนวทางการพัฒนาโรงงานให้มีประสิทธิภาพและเป็นมิตรต่อสิ่งแวดล้อม',

    '/image/energy.jpg',

    JSON_ARRAY(

        JSON_OBJECT(
            'image',
            '',
            'title',
            'การจัดการพลังงาน',
            'desc',
            'วิเคราะห์และวางแผนการใช้พลังงาน ให้มีประสิทธิภาพสูงสุด'
        ),

        JSON_OBJECT(
            'image',
            '',
            'title',
            'พลังงานทดแทน',
            'desc',
            'เรียนรู้การประยุกต์ใช้พลังงานสะอาด และพลังงานทดแทน'
        ),

        JSON_OBJECT(
            'image',
            '',
            'title',
            'พลังงานในโรงงาน',
            'desc',
            'เพิ่มประสิทธิภาพระบบพลังงาน ในกระบวนการผลิตภาคอุตสาหกรรม'
        )

    ),

    JSON_ARRAY(

        @CURRICULUM_GENERAL,

        JSON_OBJECT(
            'category',
            '2. หมวดวิชาเฉพาะ',

            'credits',
            102,

            'subCategories',
            JSON_ARRAY(

                JSON_OBJECT(
                    'name',
                    'กลุ่มวิชาวิทยาศาสตร์พื้นฐานและคณิตศาสตร์',
                    'credits',
                    21
                ),

                JSON_OBJECT(
                    'name',
                    'กลุ่มวิชาแกนวิศวกรรมศาสตร์',
                    'credits',
                    18
                ),

                JSON_OBJECT(
                    'name',
                    'กลุ่มวิชาบังคับทางวิศวกรรมการจัดการพลังงาน',
                    'credits',
                    45
                ),

                JSON_OBJECT(
                    'name',
                    'กลุ่มวิชาเลือกทางวิศวกรรมการจัดการพลังงาน',
                    'credits',
                    12
                ),

                JSON_OBJECT(
                    'name',
                    'กลุ่มวิชาฝึกงาน/สหกิจศึกษา (ไม่น้อยกว่า 300 ชั่วโมง)',
                    'credits',
                    6
                )

            )
        ),

        @CURRICULUM_FREE

    ),

    JSON_ARRAY(
        'การจัดการพลังงาน',
        'พลังงานทดแทน',
        'การอนุรักษ์พลังงาน',
        'ระบบพลังงานในโรงงาน',
        'Energy Audit',
        'ระบบควบคุมอัตโนมัติ',
        'Smart Energy',
        'การวิเคราะห์การใช้พลังงาน'
    ),

    JSON_ARRAY(
        JSON_OBJECT('title', 'Energy Engineer', 'icon', '⚡'),
        JSON_OBJECT('title', 'Energy Manager', 'icon', '🔋'),
        JSON_OBJECT('title', 'Energy Consultant', 'icon', '💡'),
        JSON_OBJECT('title', 'Industrial Engineer', 'icon', '🏭'),
        JSON_OBJECT('title', 'Energy Auditor', 'icon', '📋'),
        JSON_OBJECT('title', 'Maintenance Engineer', 'icon', '🔧'),
        JSON_OBJECT('title', 'Automation Engineer', 'icon', '🤖'),
        JSON_OBJECT('title', 'Sustainability Engineer', 'icon', '🌱')
    )
);


-- =========================================================
-- 13. INDUSTRIAL
-- admin07
-- =========================================================

INSERT INTO course_info (
    saka_path,
    faculty_name,
    title,
    english_title,
    hero_description,
    about_title,
    about_description_1,
    about_description_2,
    image,
    highlights,
    curriculum,
    skills,
    careers
)
VALUES (

    'industrial',

    'Faculty of Industrial Technology',

    'เทคโนโลยีอุตสาหการ',

    'Industrial Technology',

    'เรียนรู้เทคโนโลยีการผลิต การจัดการกระบวนการ เครื่องจักร และการเพิ่มประสิทธิภาพในภาคอุตสาหกรรม',

    'เรียนอะไรในเทคโนโลยีอุตสาหการ?',

    'ศึกษากระบวนการผลิต การจัดการเครื่องจักร การวางแผนการผลิต และการเพิ่มประสิทธิภาพ เพื่อรองรับการทำงานในภาคอุตสาหกรรม',

    'พัฒนาทักษะด้านเทคโนโลยีการผลิต การควบคุมคุณภาพ และการจัดการอุตสาหกรรม เพื่อรองรับ Smart Factory และอุตสาหกรรมยุคใหม่',

    '/image/logo.png',

    JSON_ARRAY(

        JSON_OBJECT(
            'image',
            '',
            'title',
            'Production',
            'desc',
            'กระบวนการผลิตและการวางแผน'
        ),

        JSON_OBJECT(
            'image',
            '',
            'title',
            'Machine',
            'desc',
            'เครื่องจักรและเทคโนโลยีการผลิต'
        ),

        JSON_OBJECT(
            'image',
            '',
            'title',
            'Efficiency',
            'desc',
            'เพิ่มประสิทธิภาพกระบวนการ'
        )

    ),

    JSON_ARRAY(

        @CURRICULUM_GENERAL,

        JSON_OBJECT(
            'category',
            '2. หมวดวิชาเฉพาะ',

            'credits',
            102,

            'subCategories',
            JSON_ARRAY(

                JSON_OBJECT(
                    'name',
                    'กลุ่มวิชาวิทยาศาสตร์พื้นฐานและคณิตศาสตร์',
                    'credits',
                    21
                ),

                JSON_OBJECT(
                    'name',
                    'กลุ่มวิชาแกนเทคโนโลยีอุตสาหการ',
                    'credits',
                    18
                ),

                JSON_OBJECT(
                    'name',
                    'กลุ่มวิชาบังคับทางเทคโนโลยีอุตสาหการ',
                    'credits',
                    45
                ),

                JSON_OBJECT(
                    'name',
                    'กลุ่มวิชาเลือกทางเทคโนโลยีอุตสาหการ',
                    'credits',
                    12
                ),

                JSON_OBJECT(
                    'name',
                    'กลุ่มวิชาฝึกงาน/สหกิจศึกษา (ไม่น้อยกว่า 300 ชั่วโมง)',
                    'credits',
                    6
                )

            )
        ),

        @CURRICULUM_FREE

    ),

    JSON_ARRAY(
        'การผลิต',
        'การวางแผนการผลิต',
        'การควบคุมคุณภาพ',
        'เครื่องจักร',
        'การจัดการอุตสาหกรรม',
        'Lean Manufacturing',
        'Smart Factory',
        'Industrial Technology'
    ),

    JSON_ARRAY(
        JSON_OBJECT('title', 'Production Engineer', 'icon', '🏭'),
        JSON_OBJECT('title', 'Production Planner', 'icon', '📋'),
        JSON_OBJECT('title', 'Quality Control', 'icon', '🔍'),
        JSON_OBJECT('title', 'Industrial Technician', 'icon', '🔧'),
        JSON_OBJECT('title', 'Process Engineer', 'icon', '⚙️'),
        JSON_OBJECT('title', 'Production Supervisor', 'icon', '👨‍💼'),
        JSON_OBJECT('title', 'Maintenance', 'icon', '🛠️'),
        JSON_OBJECT('title', 'Factory Staff', 'icon', '🏢')
    )
);


-- =========================================================
-- 14. LOGISTICS
-- admin08
-- =========================================================

INSERT INTO course_info (
    saka_path,
    faculty_name,
    title,
    english_title,
    hero_description,
    about_title,
    about_description_1,
    about_description_2,
    image,
    highlights,
    curriculum,
    skills,
    careers
)
VALUES (

    'logistics',

    'Faculty of Industrial Technology',

    'วิศวกรรมโลจิสติกส์',

    'Logistics Engineering',

    'เรียนรู้การวางแผนและจัดการระบบโลจิสติกส์ การขนส่ง คลังสินค้า และห่วงโซ่อุปทาน เพื่อเพิ่มประสิทธิภาพให้กับภาคอุตสาหกรรม',

    'เรียนอะไรในวิศวกรรมโลจิสติกส์?',

    'สาขาวิศวกรรมโลจิสติกส์มุ่งเน้นการออกแบบ วิเคราะห์ และปรับปรุงระบบการไหลของสินค้า ข้อมูล และทรัพยากรภายในองค์กร',

    'นักศึกษาจะได้เรียนรู้ตั้งแต่การจัดการคลังสินค้า การขนส่ง การวางแผนการผลิต ไปจนถึงการบริหารห่วงโซ่อุปทาน',

    '/image/logistics.jpg',

    JSON_ARRAY(

        JSON_OBJECT(
            'image',
            '',
            'title',
            'การขนส่ง',
            'desc',
            'เรียนรู้การวางแผนเส้นทาง การจัดการยานพาหนะ และการขนส่งสินค้า'
        ),

        JSON_OBJECT(
            'image',
            '',
            'title',
            'คลังสินค้า',
            'desc',
            'เรียนรู้การบริหารพื้นที่จัดเก็บ สินค้าคงคลัง และระบบคลังสินค้าอัจฉริยะ'
        ),

        JSON_OBJECT(
            'image',
            '',
            'title',
            'Supply Chain',
            'desc',
            'วิเคราะห์ข้อมูลและกระบวนการ เพื่อเพิ่มประสิทธิภาพของห่วงโซ่อุปทาน'
        )

    ),

    JSON_ARRAY(

        @CURRICULUM_GENERAL,

        JSON_OBJECT(
            'category',
            '2. หมวดวิชาเฉพาะ',

            'credits',
            102,

            'subCategories',
            JSON_ARRAY(

                JSON_OBJECT(
                    'name',
                    'กลุ่มวิชาวิทยาศาสตร์พื้นฐานและคณิตศาสตร์',
                    'credits',
                    21
                ),

                JSON_OBJECT(
                    'name',
                    'กลุ่มวิชาแกนวิศวกรรมศาสตร์',
                    'credits',
                    18
                ),

                JSON_OBJECT(
                    'name',
                    'กลุ่มวิชาบังคับทางวิศวกรรมโลจิสติกส์',
                    'credits',
                    45
                ),

                JSON_OBJECT(
                    'name',
                    'กลุ่มวิชาเลือกทางวิศวกรรมโลจิสติกส์',
                    'credits',
                    12
                ),

                JSON_OBJECT(
                    'name',
                    'กลุ่มวิชาฝึกงาน/สหกิจศึกษา (ไม่น้อยกว่า 300 ชั่วโมง)',
                    'credits',
                    6
                )

            )
        ),

        @CURRICULUM_FREE

    ),

    JSON_ARRAY(
        'การจัดการโลจิสติกส์',
        'Supply Chain Management',
        'การวางแผนการขนส่ง',
        'คลังสินค้าและสินค้าคงคลัง',
        'ระบบสารสนเทศด้านโลจิสติกส์',
        'Data Analytics',
        'การเพิ่มประสิทธิภาพกระบวนการ',
        'Smart Logistics'
    ),

    JSON_ARRAY(
        JSON_OBJECT('title', 'Logistics Engineer', 'icon', '🚚'),
        JSON_OBJECT('title', 'Supply Chain Engineer', 'icon', '⛓️'),
        JSON_OBJECT('title', 'Warehouse Engineer', 'icon', '📦'),
        JSON_OBJECT('title', 'Transportation Planner', 'icon', '🗺️'),
        JSON_OBJECT('title', 'Logistics Analyst', 'icon', '📊'),
        JSON_OBJECT('title', 'Supply Chain Analyst', 'icon', '📈'),
        JSON_OBJECT('title', 'Inventory Controller', 'icon', '📋'),
        JSON_OBJECT('title', 'Operations Engineer', 'icon', '⚙️')
    )
);


-- =========================================================
-- 15. MANAGEMENT
-- admin09
-- =========================================================

INSERT INTO course_info (
    saka_path,
    faculty_name,
    title,
    english_title,
    hero_description,
    about_title,
    about_description_1,
    about_description_2,
    image,
    highlights,
    curriculum,
    skills,
    careers
)
VALUES (

    'management',

    'Faculty of Industrial Technology',

    'การจัดการงานวิศวกรรม',

    'Engineering Management',

    'ผสมผสานความรู้ด้านวิศวกรรมและการบริหารจัดการ เพื่อพัฒนาผู้นำที่สามารถบริหารโครงการ บุคลากร และองค์กรได้อย่างมีประสิทธิภาพ',

    'เรียนอะไรในการจัดการงานวิศวกรรม?',

    'ศึกษาการบริหารจัดการงานด้านวิศวกรรม ทั้งการวางแผน การบริหารบุคลากร การจัดการต้นทุน และการควบคุมคุณภาพ',

    'เน้นการคิดวิเคราะห์และการตัดสินใจ เพื่อแก้ไขปัญหาและเพิ่มประสิทธิภาพขององค์กรและโครงการ',

    '/image/management.jpg',

    JSON_ARRAY(

        JSON_OBJECT(
            'image',
            '',
            'title',
            'การบริหารโครงการ',
            'desc',
            'เรียนรู้การวางแผนและบริหารโครงการ ให้เป็นไปตามเป้าหมาย'
        ),

        JSON_OBJECT(
            'image',
            '',
            'title',
            'การบริหารบุคลากร',
            'desc',
            'พัฒนาทักษะการทำงานเป็นทีม การสื่อสาร และการเป็นผู้นำ'
        ),

        JSON_OBJECT(
            'image',
            '',
            'title',
            'การเพิ่มประสิทธิภาพ',
            'desc',
            'วิเคราะห์กระบวนการและหาแนวทาง เพื่อเพิ่มประสิทธิภาพองค์กร'
        )

    ),

    JSON_ARRAY(

        @CURRICULUM_GENERAL,

        JSON_OBJECT(
            'category',
            '2. หมวดวิชาเฉพาะ',

            'credits',
            102,

            'subCategories',
            JSON_ARRAY(

                JSON_OBJECT(
                    'name',
                    'กลุ่มวิชาวิทยาศาสตร์พื้นฐานและคณิตศาสตร์',
                    'credits',
                    21
                ),

                JSON_OBJECT(
                    'name',
                    'กลุ่มวิชาแกนวิศวกรรมศาสตร์',
                    'credits',
                    18
                ),

                JSON_OBJECT(
                    'name',
                    'กลุ่มวิชาบังคับทางการจัดการงานวิศวกรรม',
                    'credits',
                    45
                ),

                JSON_OBJECT(
                    'name',
                    'กลุ่มวิชาเลือกทางการจัดการงานวิศวกรรม',
                    'credits',
                    12
                ),

                JSON_OBJECT(
                    'name',
                    'กลุ่มวิชาฝึกงาน/สหกิจศึกษา (ไม่น้อยกว่า 300 ชั่วโมง)',
                    'credits',
                    6
                )

            )
        ),

        @CURRICULUM_FREE

    ),

    JSON_ARRAY(
        'การบริหารโครงการ',
        'การจัดการองค์กร',
        'การวิเคราะห์และแก้ปัญหา',
        'การบริหารทรัพยากร',
        'การจัดการต้นทุน',
        'การบริหารคุณภาพ',
        'การวิเคราะห์ข้อมูล',
        'การวางแผนเชิงกลยุทธ์'
    ),

    JSON_ARRAY(
        JSON_OBJECT('title', 'Engineering Manager', 'icon', '👔'),
        JSON_OBJECT('title', 'Project Manager', 'icon', '📊'),
        JSON_OBJECT('title', 'Operations Manager', 'icon', '⚙️'),
        JSON_OBJECT('title', 'Project Coordinator', 'icon', '📋'),
        JSON_OBJECT('title', 'Business Analyst', 'icon', '📈'),
        JSON_OBJECT('title', 'Process Improvement Engineer', 'icon', '🔧'),
        JSON_OBJECT('title', 'Quality Manager', 'icon', '🔍'),
        JSON_OBJECT('title', 'Engineering Consultant', 'icon', '💡')
    )
);


-- =========================================================
-- 16. SURVEY
-- admin10
-- =========================================================

INSERT INTO course_info (
    saka_path,
    faculty_name,
    title,
    english_title,
    hero_description,
    about_title,
    about_description_1,
    about_description_2,
    image,
    highlights,
    curriculum,
    skills,
    careers
)
VALUES (

    'survey',

    'Faculty of Industrial Technology',

    'เทคโนโลยีสำรวจและภูมิสารสนเทศ',

    'Survey and Geoinformatics',

    'เรียนรู้การสำรวจ การทำแผนที่ และเทคโนโลยีภูมิสารสนเทศ เพื่อจัดการข้อมูลเชิงพื้นที่และสนับสนุนการพัฒนาพื้นที่',

    'เรียนอะไรในสาขานี้?',

    'ศึกษาการสำรวจพื้นที่ การทำแผนที่ ระบบสารสนเทศภูมิศาสตร์ และการจัดการข้อมูลเชิงพื้นที่ด้วยเทคโนโลยีสมัยใหม่',

    'พัฒนาทักษะการเก็บข้อมูล การวิเคราะห์ข้อมูลเชิงพื้นที่ และการใช้เทคโนโลยีภูมิสารสนเทศเพื่อประยุกต์ใช้กับงานจริง',

    '/image/logo.png',

    JSON_ARRAY(

        JSON_OBJECT(
            'image',
            '',
            'title',
            'Survey',
            'desc',
            'การสำรวจและเก็บข้อมูลภาคสนาม'
        ),

        JSON_OBJECT(
            'image',
            '',
            'title',
            'GIS',
            'desc',
            'ระบบสารสนเทศภูมิศาสตร์'
        ),

        JSON_OBJECT(
            'image',
            '',
            'title',
            'Geospatial',
            'desc',
            'เทคโนโลยีข้อมูลเชิงพื้นที่'
        )

    ),

    JSON_ARRAY(

        @CURRICULUM_GENERAL,

        JSON_OBJECT(
            'category',
            '2. หมวดวิชาเฉพาะ',

            'credits',
            102,

            'subCategories',
            JSON_ARRAY(

                JSON_OBJECT(
                    'name',
                    'กลุ่มวิชาวิทยาศาสตร์พื้นฐานและคณิตศาสตร์',
                    'credits',
                    21
                ),

                JSON_OBJECT(
                    'name',
                    'กลุ่มวิชาแกนเทคโนโลยีสำรวจและภูมิสารสนเทศ',
                    'credits',
                    18
                ),

                JSON_OBJECT(
                    'name',
                    'กลุ่มวิชาบังคับทางเทคโนโลยีสำรวจและภูมิสารสนเทศ',
                    'credits',
                    45
                ),

                JSON_OBJECT(
                    'name',
                    'กลุ่มวิชาเลือกทางเทคโนโลยีสำรวจและภูมิสารสนเทศ',
                    'credits',
                    12
                ),

                JSON_OBJECT(
                    'name',
                    'กลุ่มวิชาฝึกงาน/สหกิจศึกษา (ไม่น้อยกว่า 300 ชั่วโมง)',
                    'credits',
                    6
                )

            )
        ),

        @CURRICULUM_FREE

    ),

    JSON_ARRAY(
        'การสำรวจ',
        'การทำแผนที่',
        'GIS',
        'GPS',
        'Remote Sensing',
        'Geospatial Data',
        'การวิเคราะห์ข้อมูลพื้นที่',
        'Digital Mapping'
    ),

    JSON_ARRAY(
        JSON_OBJECT('title', 'Surveyor', 'icon', '📐'),
        JSON_OBJECT('title', 'GIS Officer', 'icon', '🗺️'),
        JSON_OBJECT('title', 'GIS Developer', 'icon', '💻'),
        JSON_OBJECT('title', 'Mapping Officer', 'icon', '📍'),
        JSON_OBJECT('title', 'Geospatial Analyst', 'icon', '📊'),
        JSON_OBJECT('title', 'Survey Technician', 'icon', '🔧'),
        JSON_OBJECT('title', 'Remote Sensing Officer', 'icon', '🛰️'),
        JSON_OBJECT('title', 'Cartographer', 'icon', '🧭')
    )
);


-- =========================================================
-- 17. ตรวจสอบ USERS
-- =========================================================

SELECT
    id,
    username,
    saka_path,
    can_edit
FROM users
ORDER BY id;


-- =========================================================
-- 18. ตรวจสอบ COURSE
-- =========================================================

SELECT
    id,
    saka_path,
    title,
    english_title
FROM course_info
ORDER BY id;

