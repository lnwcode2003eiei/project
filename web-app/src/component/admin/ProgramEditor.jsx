import { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { apiUrl } from "../../config/api";

function EditableSection({ children, onEdit }) {
  return (
    <div className="group relative">
      <div className="pointer-events-none absolute inset-0 z-10 rounded-3xl border-2 border-dashed border-[#7A0019] opacity-0 transition duration-200 group-hover:opacity-100" />
      <button
        type="button"
        onClick={onEdit}
        className="absolute right-5 top-5 z-20 rounded-xl bg-[#7A0019] px-4 py-2 text-sm font-semibold text-white opacity-0 shadow-lg transition duration-200 group-hover:opacity-100 hover:bg-[#5C0013]"
      >
        แก้ไข
      </button>
      {children}
    </div>
  );
}

function ProgramEditor() {
  const { sakaPath: selectedSakaPath } = useParams();
  const [sakaPath, setSakaPath] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // ==========================================
  // รูปภาพหลักของสาขา
  // ==========================================

  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");

  // ==========================================
  // รูปภาพของ Highlights
  // ==========================================

  const [highlightImageFiles, setHighlightImageFiles] = useState({});
  const [highlightImagePreviews, setHighlightImagePreviews] = useState({});
  const [careerImageFiles, setCareerImageFiles] = useState({});
  const [careerImagePreviews, setCareerImagePreviews] = useState({});
  const [atmosphereImageFiles, setAtmosphereImageFiles] = useState({});
  const [atmosphereImagePreviews, setAtmosphereImagePreviews] = useState({});

  // ==========================================
  // ส่วนที่กำลังแก้ไข
  // ==========================================

  const [editing, setEditing] = useState(null);
  const [curriculumPlan, setCurriculumPlan] = useState("curriculum");

  // ==========================================
  // ข้อมูลสาขา
  // ==========================================

  const [form, setForm] = useState({
    faculty_name: "",
    title: "",
    english_title: "",
    hero_description: "",

    about_title: "",
    about_description_1: "",
    about_description_2: "",

    image: "",

    highlights: [],
    curriculum: [],
    curriculum_transfer: [],
    skills: [],
    careers: [],
    learning_environment: [],
  });

  // ==========================================
  // โหลดข้อมูลสาขา
  // ==========================================

  const loadCourse = useCallback(async () => {
    try {
      setLoading(true);

      const adminUser = JSON.parse(
        localStorage.getItem("adminUser") || "{}",
      );

      const accountSakaPath =
        adminUser.saka_path || localStorage.getItem("userRole");
      const path = selectedSakaPath || accountSakaPath;

      if (!path || (path === "all" && accountSakaPath !== "all")) {
        alert(
          "ไม่พบสาขาที่รับผิดชอบ หรือบัญชีนี้ไม่มีสิทธิ์แก้ไขสาขา",
        );

        setLoading(false);
        return;
      }

      if (accountSakaPath !== "all" && accountSakaPath !== path) {
        alert("คุณไม่มีสิทธิ์จัดการหลักสูตรนี้");
        setLoading(false);
        return;
      }

      setSakaPath(path);

      const response = await fetch(
        apiUrl(`/api/courses/${path}`),
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "โหลดข้อมูลสาขาไม่สำเร็จ",
        );
      }

      setForm({
        faculty_name: data.data.faculty_name || "",

        title: data.data.title || "",

        english_title: data.data.english_title || "",

        hero_description: data.data.hero_description || "",

        about_title: data.data.about_title || "",

        about_description_1:
          data.data.about_description_1 || "",

        about_description_2:
          data.data.about_description_2 || "",

        image: data.data.image || "",

        highlights: Array.isArray(data.data.highlights)
          ? data.data.highlights
          : [],

        curriculum: Array.isArray(data.data.curriculum)
          ? data.data.curriculum
          : [],

        curriculum_transfer: Array.isArray(data.data.curriculum_transfer)
          ? data.data.curriculum_transfer
          : [],

        skills: Array.isArray(data.data.skills)
          ? data.data.skills
          : [],

        careers: Array.isArray(data.data.careers)
          ? data.data.careers
          : [],
        learning_environment: Array.isArray(data.data.learning_environment)
          ? data.data.learning_environment
          : [],
      });
    } catch (error) {
      console.error(
        "โหลดข้อมูลสาขาไม่สำเร็จ:",
        error,
      );

      alert(error.message);
    } finally {
      setLoading(false);
    }
  }, [selectedSakaPath]);

  useEffect(() => {
    const timer = window.setTimeout(loadCourse, 0);
    return () => window.clearTimeout(timer);
  }, [loadCourse]);

  useEffect(() => () => {
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
    }

    Object.values(highlightImagePreviews).forEach((url) => {
      if (url) {
        URL.revokeObjectURL(url);
      }
    });

    Object.values(careerImagePreviews).forEach((url) => {
      if (url) URL.revokeObjectURL(url);
    });
  }, [imagePreview, highlightImagePreviews, careerImagePreviews]);

  // ==========================================
  // เปลี่ยนข้อมูลทั่วไป
  // ==========================================

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // ==========================================
  // เลือกรูปหลักของสาขา
  // ==========================================

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];

    if (!file) {
      return;
    }

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/jpg",
    ];

    if (!allowedTypes.includes(file.type)) {
      alert("รองรับเฉพาะ JPG, PNG และ WebP");

      e.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert("ขนาดรูปภาพต้องไม่เกิน 5MB");

      e.target.value = "";
      return;
    }

    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
    }

    const previewUrl = URL.createObjectURL(file);

    setImageFile(file);
    setImagePreview(previewUrl);
  };

  // ==========================================
  // เลือกรูป Highlight
  // ==========================================

  const handleHighlightImageChange = (index, e) => {
    const file = e.target.files?.[0];

    if (!file) {
      return;
    }

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/jpg",
    ];

    if (!allowedTypes.includes(file.type)) {
      alert("รองรับเฉพาะ JPG, PNG และ WebP");

      e.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert("ขนาดรูปภาพต้องไม่เกิน 5MB");

      e.target.value = "";
      return;
    }

    if (highlightImagePreviews[index]) {
      URL.revokeObjectURL(
        highlightImagePreviews[index],
      );
    }

    const previewUrl = URL.createObjectURL(file);

    setHighlightImageFiles((prev) => ({
      ...prev,
      [index]: file,
    }));

    setHighlightImagePreviews((prev) => ({
      ...prev,
      [index]: previewUrl,
    }));
  };

  const handleCareerImageChange = (index, e) => {
    const file = e.target.files?.[0];
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/jpg"];

    if (!file) return;
    if (!allowedTypes.includes(file.type) || file.size > 5 * 1024 * 1024) {
      alert("รองรับเฉพาะ JPG, PNG และ WebP ขนาดไม่เกิน 5MB");
      e.target.value = "";
      return;
    }

    if (careerImagePreviews[index]) URL.revokeObjectURL(careerImagePreviews[index]);
    const previewUrl = URL.createObjectURL(file);
    setCareerImageFiles((prev) => ({ ...prev, [index]: file }));
    setCareerImagePreviews((prev) => ({ ...prev, [index]: previewUrl }));
  };

  const updateAtmosphere = (index, field, value) => setForm((prev) => ({
    ...prev,
    learning_environment: prev.learning_environment.map((item, i) => i === index ? { ...item, [field]: value } : item),
  }));

  const addAtmosphere = () => setForm((prev) => ({
    ...prev,
    learning_environment: [...prev.learning_environment, { image: "", title: "", description: "" }],
  }));

  const removeAtmosphere = (index) => setForm((prev) => ({
    ...prev,
    learning_environment: prev.learning_environment.filter((_, i) => i !== index),
  }));

  const handleAtmosphereImageChange = (index, e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp", "image/jpg"].includes(file.type) || file.size > 5 * 1024 * 1024) {
      alert("รองรับเฉพาะ JPG, PNG และ WebP ขนาดไม่เกิน 5MB");
      return;
    }
    const preview = URL.createObjectURL(file);
    setAtmosphereImageFiles((prev) => ({ ...prev, [index]: file }));
    setAtmosphereImagePreviews((prev) => ({ ...prev, [index]: preview }));
  };

  // ==========================================
  // Highlights
  // ==========================================

  const updateHighlight = (
    index,
    field,
    value,
  ) => {
    setForm((prev) => ({
      ...prev,

      highlights: prev.highlights.map(
        (item, i) =>
          i === index
            ? {
                ...item,
                [field]: value,
              }
            : item,
      ),
    }));
  };

  const addHighlight = () => {
    setForm((prev) => ({
      ...prev,

      highlights: [
        ...prev.highlights,

        {
          image: "",
          title: "",
          desc: "",
        },
      ],
    }));
  };

  const removeHighlight = (index) => {
    if (highlightImagePreviews[index]) {
      URL.revokeObjectURL(
        highlightImagePreviews[index],
      );
    }

    setHighlightImageFiles((prev) => {
      const next = {
        ...prev,
      };

      delete next[index];

      return next;
    });

    setHighlightImagePreviews((prev) => {
      const next = {
        ...prev,
      };

      delete next[index];

      return next;
    });

    setForm((prev) => ({
      ...prev,

      highlights: prev.highlights.filter(
        (_, i) => i !== index,
      ),
    }));
  };

  // ==========================================
  // Skills
  // ==========================================

  const updateSkill = (index, value) => {
    setForm((prev) => ({
      ...prev,

      skills: prev.skills.map(
        (item, i) =>
          i === index ? value : item,
      ),
    }));
  };

  const addSkill = () => {
    setForm((prev) => ({
      ...prev,

      skills: [
        ...prev.skills,
        "",
      ],
    }));
  };

  const removeSkill = (index) => {
    setForm((prev) => ({
      ...prev,

      skills: prev.skills.filter(
        (_, i) => i !== index,
      ),
    }));
  };

  // ==========================================
  // Careers
  // ==========================================

  const updateCareer = (
    index,
    field,
    value,
  ) => {
    setForm((prev) => ({
      ...prev,

      careers: prev.careers.map(
        (item, i) =>
          i === index
            ? {
                ...item,
                [field]: value,
              }
            : item,
      ),
    }));
  };

  const addCareer = () => {
    setForm((prev) => ({
      ...prev,

      careers: [
        ...prev.careers,

        {
          title: "",
          description: "",
          image: "",
        },
      ],
    }));
  };

  const removeCareer = (index) => {
    if (careerImagePreviews[index]) URL.revokeObjectURL(careerImagePreviews[index]);

    setCareerImageFiles((prev) => {
      const next = { ...prev };
      delete next[index];
      return next;
    });

    setCareerImagePreviews((prev) => {
      const next = { ...prev };
      delete next[index];
      return next;
    });

    setForm((prev) => ({
      ...prev,

      careers: prev.careers.filter(
        (_, i) => i !== index,
      ),
    }));
  };

  // ==========================================
  // Curriculum
  // ==========================================

  const updateCurriculum = (
    groupIndex,
    field,
    value,
  ) => {
    setForm((prev) => ({
      ...prev,

      [curriculumPlan]: prev[curriculumPlan].map(
        (group, i) =>
          i === groupIndex
            ? {
                ...group,

                [field]:
                  field === "credits"
                    ? Number(value)
                    : value,
              }
            : group,
      ),
    }));
  };

  const addCurriculum = () => {
    setForm((prev) => ({
      ...prev,

      [curriculumPlan]: [
        ...prev[curriculumPlan],

        {
          category: "",
          credits: 0,
          subCategories: [],
        },
      ],
    }));
  };

  const removeCurriculum = (
    groupIndex,
  ) => {
    setForm((prev) => ({
      ...prev,

      [curriculumPlan]: prev[curriculumPlan].filter(
        (_, i) => i !== groupIndex,
      ),
    }));
  };

  const moveCurriculum = (groupIndex, direction) => {
    setForm((prev) => {
      const next = [...prev[curriculumPlan]];
      const targetIndex = groupIndex + direction;
      if (targetIndex < 0 || targetIndex >= next.length) return prev;
      [next[groupIndex], next[targetIndex]] = [next[targetIndex], next[groupIndex]];
      return { ...prev, [curriculumPlan]: next };
    });
  };

  const addSubCategory = (
    groupIndex,
  ) => {
    setForm((prev) => ({
      ...prev,

      [curriculumPlan]: prev[curriculumPlan].map(
        (group, i) =>
          i === groupIndex
            ? {
                ...group,

                subCategories: [
                  ...(group.subCategories ||
                    []),

                  {
                    name: "",
                    credits: 0,
                  },
                ],
              }
            : group,
      ),
    }));
  };

  const updateSubCategory = (
    groupIndex,
    subIndex,
    field,
    value,
  ) => {
    setForm((prev) => ({
      ...prev,

      [curriculumPlan]: prev[curriculumPlan].map(
        (group, i) =>
          i === groupIndex
            ? {
                ...group,

                subCategories: (
                  group.subCategories ||
                  []
                ).map(
                  (sub, j) =>
                    j === subIndex
                      ? {
                          ...sub,

                          [field]:
                            field === "credits"
                              ? Number(
                                  value,
                                )
                              : value,
                        }
                      : sub,
                ),
              }
            : group,
      ),
    }));
  };

  const removeSubCategory = (
    groupIndex,
    subIndex,
  ) => {
    setForm((prev) => ({
      ...prev,

      [curriculumPlan]: prev[curriculumPlan].map(
        (group, i) =>
          i === groupIndex
            ? {
                ...group,

                subCategories: (
                  group.subCategories ||
                  []
                ).filter(
                  (_, j) =>
                    j !== subIndex,
                ),
              }
            : group,
      ),
    }));
  };

  // ==========================================
  // แปลง path รูปเป็น URL
  // ==========================================

  const getImageUrl = (
    imagePath,
  ) => {
    if (!imagePath) {
      return "";
    }

    if (
      imagePath.startsWith("http://") ||
      imagePath.startsWith("https://")
    ) {
      return imagePath;
    }

    return apiUrl(imagePath);
  };

  // ==========================================
  // บันทึกข้อมูลทั้งหมด
  // ==========================================

  const handleSave = async () => {
    if (!sakaPath) {
      alert(
        "ไม่พบสาขาที่ต้องการแก้ไข",
      );
      return;
    }

    if (!form.title.trim()) {
      alert(
        "กรุณากรอกชื่อสาขา",
      );
      return;
    }

    // ========================================
    // ดึง Admin ที่ Login อยู่
    // ========================================

    const adminUser = JSON.parse(
      localStorage.getItem("adminUser") || "{}",
    );

    const canEdit = Number(
      adminUser.can_edit ?? 0,
    );

    const token = localStorage.getItem("token");

    if (!token) {
      alert(
        "ไม่พบข้อมูลผู้ดูแลระบบ กรุณาเข้าสู่ระบบใหม่",
      );
      return;
    }

    if (canEdit !== 1) {
      alert(
        "บัญชีนี้ไม่มีสิทธิ์แก้ไขข้อมูล",
      );
      return;
    }

    setSaving(true);

    try {
      // ========================================
      // รูปหลักของสาขา
      // ========================================

      let imagePath = form.image;

      if (imageFile) {
        const imageFormData =
          new FormData();

        imageFormData.append(
          "image",
          imageFile,
        );

        const imageResponse =
          await fetch(
            apiUrl(`/api/courses/${sakaPath}/image`),
            {
              method: "POST",

              headers: {
                Authorization: `Bearer ${token}`,
              },

              body: imageFormData,
            },
          );

        const imageData =
          await imageResponse.json();

        if (
          !imageResponse.ok ||
          !imageData.success
        ) {
          throw new Error(
            imageData.message ||
              "อัปโหลดรูปหลักไม่สำเร็จ",
          );
        }

        imagePath =
          imageData.image;
      }

      // ========================================
      // เตรียม Highlights
      // ========================================

      const updatedHighlights = [
        ...form.highlights,
      ];

      // ========================================
      // Upload รูป Highlights
      // ========================================

      for (
        const [
          indexString,
          file,
        ] of Object.entries(
          highlightImageFiles,
        )
      ) {
        const index =
          Number(indexString);

        if (!file) {
          continue;
        }

        const imageFormData =
          new FormData();

        imageFormData.append(
          "image",
          file,
        );

        const imageResponse =
          await fetch(
            apiUrl(`/api/courses/${sakaPath}/highlight-image`),
            {
              method: "POST",

              headers: {
                Authorization: `Bearer ${token}`,
              },

              body: imageFormData,
            },
          );

        const imageData =
          await imageResponse.json();

        if (
          !imageResponse.ok ||
          !imageData.success
        ) {
          throw new Error(
            imageData.message ||
              `อัปโหลดรูปจุดเด่นที่ ${
                index + 1
              } ไม่สำเร็จ`,
          );
        }

        if (
          updatedHighlights[index]
        ) {
          updatedHighlights[index] =
            {
              ...updatedHighlights[
                index
              ],

              image:
                imageData.image,
            };
        }
      }

      // ========================================
      // Upload รูปอาชีพ
      // ========================================

      const updatedCareers = [...form.careers];

      for (const [indexString, file] of Object.entries(careerImageFiles)) {
        const index = Number(indexString);
        if (!file) continue;

        const imageFormData = new FormData();
        imageFormData.append("image", file);

        const imageResponse = await fetch(
          apiUrl(`/api/courses/${sakaPath}/highlight-image`),
          {
            method: "POST",
            headers: { Authorization: `Bearer ${token}` },
            body: imageFormData,
          },
        );
        const imageData = await imageResponse.json();

        if (!imageResponse.ok || !imageData.success) {
          throw new Error(imageData.message || `อัปโหลดรูปอาชีพที่ ${index + 1} ไม่สำเร็จ`);
        }

        if (updatedCareers[index]) {
          updatedCareers[index] = { ...updatedCareers[index], image: imageData.image };
        }
      }

      const updatedAtmosphere = [...form.learning_environment];
      for (const [indexString, file] of Object.entries(atmosphereImageFiles)) {
        const index = Number(indexString);
        if (!file) continue;
        const imageFormData = new FormData();
        imageFormData.append("image", file);
        const imageResponse = await fetch(apiUrl(`/api/courses/${sakaPath}/highlight-image`), {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: imageFormData,
        });
        const imageData = await imageResponse.json();
        if (!imageResponse.ok || !imageData.success) throw new Error("อัปโหลดรูปบรรยากาศไม่สำเร็จ");
        if (updatedAtmosphere[index]) updatedAtmosphere[index] = { ...updatedAtmosphere[index], image: imageData.image };
      }

      // ========================================
      // บันทึก DB
      // ========================================

      const response =
        await fetch(
          apiUrl(`/api/courses/${sakaPath}`),
          {
            method: "PUT",

            headers: {
              "Content-Type":
                "application/json",

              Authorization: `Bearer ${token}`,
            },

            body: JSON.stringify({
              ...form,

              image:
                imagePath,

              highlights:
                updatedHighlights,

              careers: updatedCareers,
              learning_environment: updatedAtmosphere,
            }),
          },
        );

      const data =
        await response.json();

      if (
        !response.ok ||
        !data.success
      ) {
        throw new Error(
          data.message ||
            "บันทึกข้อมูลไม่สำเร็จ",
        );
      }

      // ========================================
      // Cleanup
      // ========================================

      if (imagePreview) {
        URL.revokeObjectURL(
          imagePreview,
        );
      }

      Object.values(
        highlightImagePreviews,
      ).forEach((url) => {
        if (url) {
          URL.revokeObjectURL(
            url,
          );
        }
      });

      setImageFile(null);
      setImagePreview("");

      setHighlightImageFiles({});
      setHighlightImagePreviews({});
      setCareerImageFiles({});
      setCareerImagePreviews({});

      setEditing(null);

      alert(
        "บันทึกข้อมูลสำเร็จ",
      );

      await loadCourse();
    } catch (error) {
      console.error(
        "บันทึกข้อมูลไม่สำเร็จ:",
        error,
      );

      alert(error.message);
    } finally {
      setSaving(false);
    }
  };

  // ==========================================
  // Loading
  // ==========================================

  if (loading) {
    return (
      <div className="flex min-h-[500px] items-center justify-center">
        <p className="text-gray-400">
          กำลังโหลดหน้าสาขา...
        </p>
      </div>
    );
  }

  // ==========================================
  // Preview
  // ==========================================

  return (
    <div className="mx-auto max-w-7xl pb-24">
      {/* ================================= */}
      {/* Header */}
      {/* ================================= */}

      <div className="mb-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#7A0019]">
              Branch Editor
            </p>

            <h1 className="mt-2 text-3xl font-bold text-gray-900">
              จัดการหน้าสาขา
            </h1>

            <p className="mt-2 text-sm text-gray-500">
              กำลังแก้ไขสาขา:

              <span className="ml-2 font-bold text-[#7A0019]">
                {sakaPath}
              </span>
            </p>
          </div>

          <button
            type="button"
            onClick={loadCourse}
            className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-600 transition hover:bg-gray-50"
          >
            ↻ โหลดข้อมูลใหม่
          </button>
        </div>
      </div>

      {/* ================================= */}
      {/* Notice */}
      {/* ================================= */}

      <div className="mb-6 rounded-2xl border border-[#7A0019]/10 bg-[#7A0019]/5 px-5 py-4">
        <p className="text-sm font-semibold text-[#7A0019]">
          โหมดแก้ไขหน้าเว็บไซต์
        </p>

        <p className="mt-1 text-sm text-gray-600">
          เลื่อนเมาส์ไปยังส่วนที่ต้องการแก้ไข แล้วกดปุ่มแก้ไข
        </p>
      </div>

      {/* ================================= */}
      {/* HERO */}
      {/* ================================= */}

      <EditableSection
        onEdit={() =>
          setEditing("hero")
        }
      >
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#7A0019] via-[#8B001E] to-[#580012] px-6 py-16 text-white shadow-xl md:px-10 md:py-20">
          <div className="mx-auto max-w-7xl">
            <span className="inline-block rounded-full bg-white/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-red-200 backdrop-blur-md">
              {form.english_title ||
                "Faculty"}
            </span>

            <h2 className="mt-4 max-w-5xl text-4xl font-extrabold tracking-tight md:text-6xl">
              {form.title ||
                "ชื่อสาขา"}
            </h2>

            <p className="mt-6 max-w-4xl text-lg leading-relaxed text-red-50/90 md:text-xl">
              {form.hero_description ||
                "คำอธิบายสาขา"}
            </p>
          </div>
        </section>
      </EditableSection>

      {/* ================================= */}
      {/* ABOUT */}
      {/* ================================= */}

      <EditableSection
        onEdit={() =>
          setEditing("about")
        }
      >
        <section className="mt-6 rounded-3xl bg-white px-6 py-10 shadow-sm md:px-10 md:py-14">
          <div className="grid items-center gap-10 lg:grid-cols-2">
            <div className="overflow-hidden rounded-3xl bg-gray-100 shadow-xl">
              {imagePreview ||
              form.image ? (
                <img
                  src={
                    imagePreview ||
                    getImageUrl(
                      form.image,
                    )
                  }
                  alt={form.title}
                  className="h-[360px] w-full object-cover"
                />
              ) : (
                <div className="flex h-[360px] items-center justify-center text-gray-400">
                  ยังไม่มีรูปภาพ
                </div>
              )}
            </div>

            <div>
              <span className="text-sm font-bold uppercase tracking-widest text-[#7A0019]">
                About The Program
              </span>

              <h2 className="mt-3 text-3xl font-bold text-gray-900 md:text-4xl">
                {form.about_title ||
                  "หัวข้อเกี่ยวกับสาขา"}
              </h2>

              <p className="mt-5 text-lg leading-relaxed text-gray-600">
                {form.about_description_1 ||
                  "รายละเอียดเกี่ยวกับสาขา"}
              </p>

              <p className="mt-5 text-lg leading-relaxed text-gray-600">
                {form.about_description_2 ||
                  ""}
              </p>
            </div>
          </div>
        </section>
      </EditableSection>

      {/* ================================= */}
      {/* HIGHLIGHTS */}
      {/* ================================= */}

      <EditableSection
        onEdit={() =>
          setEditing("highlights")
        }
      >
        <section className="mt-6 rounded-3xl bg-white px-6 py-12 shadow-sm md:px-10">
          <div className="text-center">
            <span className="text-xs font-bold uppercase tracking-widest text-[#7A0019]">
              Program Highlights
            </span>

            <h2 className="mt-2 text-3xl font-bold text-gray-900">
              จุดเด่นของสาขาวิชา
            </h2>
          </div>

          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {form.highlights.length >
            0 ? (
              form.highlights.map(
                (item, index) => (
                  <div
                    key={index}
                    className="rounded-2xl border border-gray-100 bg-slate-50 p-7 shadow-sm"
                  >
                    <div className="mx-auto mb-5 flex h-24 w-24 items-center justify-center overflow-hidden rounded-2xl bg-red-50">
                      {highlightImagePreviews[
                        index
                      ] ||
                      item.image ? (
                        <img
                          src={
                            highlightImagePreviews[
                              index
                            ] ||
                            getImageUrl(
                              item.image,
                            )
                          }
                          alt={
                            item.title ||
                            "Highlight"
                          }
                          className="h-full w-full object-contain p-2"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-xs text-gray-400">
                          ไม่มีรูป
                        </div>
                      )}
                    </div>

                    <h3 className="text-xl font-bold text-gray-900">
                      {item.title ||
                        "จุดเด่น"}
                    </h3>

                    <p className="mt-3 leading-relaxed text-gray-600">
                      {item.desc ||
                        ""}
                    </p>
                  </div>
                ),
              )
            ) : (
              <p className="text-sm text-gray-400">
                ยังไม่มีข้อมูลจุดเด่น
              </p>
            )}
          </div>
        </section>
      </EditableSection>

      {/* ================================= */}
      {/* CURRICULUM */}
      {/* ================================= */}

      <EditableSection
        onEdit={() =>
          { setCurriculumPlan("curriculum"); setEditing("curriculum"); }
        }
      >
        <section className="mt-6 rounded-3xl bg-slate-100/70 px-6 py-12 md:px-10">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900">
              โครงสร้างหลักสูตร
            </h2>
          </div>

          <div className="mx-auto mt-8 max-w-5xl overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="bg-black text-white">
                  <th className="px-6 py-4 text-center">
                    รายละเอียดหมวดวิชา
                  </th>

                  <th className="w-32 px-6 py-4 text-center">
                    หน่วยกิต
                  </th>
                </tr>
              </thead>

              <tbody>
                {form.curriculum.map(
                  (
                    group,
                    groupIndex,
                  ) => (
                    <tr
                      key={
                        groupIndex
                      }
                      className="bg-white"
                    >
                      <td
                        colSpan={2}
                        className="p-0"
                      >
                        <div>
                          <div className="grid grid-cols-[1fr_128px] bg-[#7A0019] font-bold text-white">
                            <div className="px-6 py-4">
                              {
                                group.category
                              }
                            </div>

                            <div className="px-6 py-4 text-center">
                              {
                                group.credits
                              }
                            </div>
                          </div>

                          {(
                            group.subCategories ||
                            []
                          ).map(
                            (
                              sub,
                              subIndex,
                            ) => (
                              <div
                                key={
                                  subIndex
                                }
                                className="grid grid-cols-[1fr_128px] border-b border-gray-100 bg-slate-50/50"
                              >
                                <div className="px-6 py-3 pl-12 text-gray-700">
                                  {
                                    sub.name
                                  }
                                </div>

                                <div className="px-6 py-3 text-center text-gray-600">
                                  {
                                    sub.credits
                                  }
                                </div>
                              </div>
                            ),
                          )}
                        </div>
                      </td>
                    </tr>
                  ),
                )}
              </tbody>
            </table>
          </div>
        </section>
      </EditableSection>

      {/* ================================= */}
      {/* SKILLS */}
      {/* ================================= */}

      <EditableSection
        onEdit={() =>
          setEditing("skills")
        }
      >
        <section className="mt-6 rounded-3xl bg-slate-50 px-6 py-12 md:px-10">
          <div className="grid gap-10 lg:grid-cols-12">
            <div className="lg:col-span-5">
              <h2 className="text-3xl font-bold text-gray-900">
                ทักษะและความเชี่ยวชาญที่จะได้รับ
              </h2>

              <p className="mt-4 text-lg leading-relaxed text-gray-600">
                ทักษะที่นักศึกษาจะได้รับจากหลักสูตร
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:col-span-7">
              {form.skills.map(
                (skill, index) => (
                  <div
                    key={index}
                    className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm"
                  >
                    <span className="font-medium text-gray-700">
                      {skill}
                    </span>
                  </div>
                ),
              )}
            </div>
          </div>
        </section>
      </EditableSection>

      {/* ================================= */}
      {/* CAREERS */}
      {/* ================================= */}

      <EditableSection
        onEdit={() =>
          setEditing("careers")
        }
      >
        <section className="career-showcase mt-6 rounded-3xl bg-white px-6 py-12 md:px-10">
          <div className="career-showcase__admin-heading text-center">
            <h2 className="text-3xl font-bold">
              จบแล้วทำงานตำแหน่งอะไรได้บ้าง?
            </h2>
          </div>

          <div className="career-showcase__list mt-10">
            {form.careers.map(
              (
                career,
                index,
              ) => (
                <div
                  key={index}
                  data-description={career.description || ""}
                  className="career-showcase__card"
                >
                  {career.image && (
                    <img
                      src={getImageUrl(career.image)}
                      alt={career.title || "อาชีพ"}
                      className="h-12 w-12 rounded-lg object-cover"
                    />
                  )}

                  <span className="font-semibold">
                    {career.title}
                  </span>
                </div>
              ),
            )}
          </div>
        </section>
      </EditableSection>

      <EditableSection onEdit={() => setEditing("atmosphere")}>
        <section className="mt-6 rounded-3xl bg-[#f8f5f5] px-6 py-10 md:px-10">
          <h2 className="text-3xl font-bold text-gray-900">บรรยากาศการเรียนการสอน</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {form.learning_environment.length ? form.learning_environment.map((item, index) => (
              <div key={index} className="overflow-hidden rounded-2xl bg-white shadow-sm">
                {item.image ? <img src={getImageUrl(item.image)} alt={item.title || "บรรยากาศ"} className="h-40 w-full object-cover" /> : <div className="flex h-40 items-center justify-center bg-[#7A0019] text-sm text-white">ไม่มีรูปภาพ</div>}
                <p className="p-4 font-semibold text-gray-800">{item.title || "กิจกรรมการเรียนรู้"}</p>
              </div>
            )) : <p className="text-gray-500">กด “แก้ไข” เพื่อเพิ่มรูปภาพ</p>}
          </div>
        </section>
      </EditableSection>

      {/* ================================= */}
      {/* SAVE */}
      {/* ================================= */}

      <div className="mt-8 flex justify-end">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="rounded-xl bg-[#7A0019] px-8 py-4 font-bold text-white shadow-lg transition hover:bg-[#5C0013] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving
            ? "กำลังบันทึก..."
            : "บันทึกทั้งหมด"}
        </button>
      </div>

      {/* ================================= */}
      {/* MODAL */}
      {/* ================================= */}

      {editing && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl md:p-8">

            {/* Modal Header */}

            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  แก้ไขข้อมูล
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  {editing}
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setEditing(null)
                }
                className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200"
              >
                ปิด
              </button>
            </div>

            {/* ================================= */}
            {/* HERO */}
            {/* ================================= */}

            {editing === "hero" && (
              <div className="mt-6 space-y-5">
                <div>
                  <label className="mb-2 block text-sm font-semibold">
                    ชื่อคณะ
                  </label>

                  <input
                    name="faculty_name"
                    value={
                      form.faculty_name
                    }
                    onChange={
                      handleChange
                    }
                    className="w-full rounded-xl border border-gray-200 px-4 py-3"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold">
                    ชื่อสาขา
                  </label>

                  <input
                    name="title"
                    value={
                      form.title
                    }
                    onChange={
                      handleChange
                    }
                    className="w-full rounded-xl border border-gray-200 px-4 py-3"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold">
                    ชื่อภาษาอังกฤษ
                  </label>

                  <input
                    name="english_title"
                    value={
                      form.english_title
                    }
                    onChange={
                      handleChange
                    }
                    className="w-full rounded-xl border border-gray-200 px-4 py-3"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold">
                    คำอธิบาย Hero
                  </label>

                  <textarea
                    name="hero_description"
                    value={
                      form.hero_description
                    }
                    onChange={
                      handleChange
                    }
                    rows={5}
                    className="w-full resize-none rounded-xl border border-gray-200 px-4 py-3"
                  />
                </div>
              </div>
            )}

            {/* ================================= */}
            {/* ABOUT */}
            {/* ================================= */}

            {editing === "about" && (
              <div className="mt-6 space-y-5">
                <div>
                  <label className="mb-2 block text-sm font-semibold">
                    หัวข้อ
                  </label>

                  <input
                    name="about_title"
                    value={
                      form.about_title
                    }
                    onChange={
                      handleChange
                    }
                    className="w-full rounded-xl border border-gray-200 px-4 py-3"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold">
                    รายละเอียด 1
                  </label>

                  <textarea
                    name="about_description_1"
                    value={
                      form.about_description_1
                    }
                    onChange={
                      handleChange
                    }
                    rows={6}
                    className="w-full resize-none rounded-xl border border-gray-200 px-4 py-3"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold">
                    รายละเอียด 2
                  </label>

                  <textarea
                    name="about_description_2"
                    value={
                      form.about_description_2
                    }
                    onChange={
                      handleChange
                    }
                    rows={6}
                    className="w-full resize-none rounded-xl border border-gray-200 px-4 py-3"
                  />
                </div>

                {/* รูปหลัก */}

                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-700">
                    รูปภาพสาขา
                  </label>

                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/jpg"
                    onChange={
                      handleImageChange
                    }
                    className="w-full cursor-pointer rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm file:mr-4 file:rounded-lg file:border-0 file:bg-[#7A0019] file:px-4 file:py-2 file:font-semibold file:text-white hover:file:bg-[#5C0013]"
                  />

                  <p className="mt-2 text-xs text-gray-400">
                    รองรับ JPG, PNG และ WebP ขนาดไม่เกิน 5MB
                  </p>

                  {(
                    imagePreview ||
                    form.image
                  ) && (
                    <div className="mt-4 overflow-hidden rounded-xl border border-gray-200">
                      <img
                        src={
                          imagePreview ||
                          getImageUrl(
                            form.image,
                          )
                        }
                        alt="Preview"
                        className="h-64 w-full object-cover"
                      />
                    </div>
                  )}

                  {imageFile && (
                    <p className="mt-2 text-xs text-gray-500">
                      ไฟล์:{" "}
                      {
                        imageFile.name
                      }
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* ================================= */}
            {/* HIGHLIGHTS */}
            {/* ================================= */}

            {editing ===
              "highlights" && (
              <div className="mt-6">
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={
                      addHighlight
                    }
                    className="rounded-xl bg-[#7A0019] px-4 py-2 text-sm font-semibold text-white"
                  >
                    เพิ่มจุดเด่น
                  </button>
                </div>

                <div className="mt-4 space-y-5">
                  {form.highlights.map(
                    (
                      item,
                      index,
                    ) => (
                      <div
                        key={index}
                        className="rounded-2xl border border-gray-200 p-5"
                      >
                        {/* รูปภาพ */}

                        <div>
                          <label className="mb-2 block text-sm font-semibold text-gray-700">
                            รูปภาพจุดเด่น
                          </label>

                          <input
                            type="file"
                            accept="image/jpeg,image/png,image/webp,image/jpg"
                            onChange={(e) =>
                              handleHighlightImageChange(
                                index,
                                e,
                              )
                            }
                            className="w-full cursor-pointer rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm file:mr-4 file:rounded-lg file:border-0 file:bg-[#7A0019] file:px-4 file:py-2 file:font-semibold file:text-white hover:file:bg-[#5C0013]"
                          />

                          <p className="mt-2 text-xs text-gray-400">
                            รองรับ JPG, PNG และ WebP ขนาดไม่เกิน 5MB
                          </p>

                          {(
                            highlightImagePreviews[
                              index
                            ] ||
                            item.image
                          ) && (
                            <div className="mt-4 flex justify-center">
                              <div className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-2xl border border-gray-200 bg-gray-50">
                                <img
                                  src={
                                    highlightImagePreviews[
                                      index
                                    ] ||
                                    getImageUrl(
                                      item.image,
                                    )
                                  }
                                  alt={
                                    item.title ||
                                    "Highlight"
                                  }
                                  className="h-full w-full object-contain p-2"
                                />
                              </div>
                            </div>
                          )}

                          {highlightImageFiles[
                            index
                          ] && (
                            <p className="mt-2 text-center text-xs text-gray-500">
                              ไฟล์ใหม่:{" "}
                              {
                                highlightImageFiles[
                                  index
                                ].name
                              }
                            </p>
                          )}
                        </div>

                        {/* หัวข้อ */}

                        <div className="mt-5">
                          <label className="mb-2 block text-sm font-semibold">
                            หัวข้อจุดเด่น
                          </label>

                          <input
                            value={
                              item.title ||
                              ""
                            }
                            onChange={(e) =>
                              updateHighlight(
                                index,
                                "title",
                                e.target
                                  .value,
                              )
                            }
                            placeholder="หัวข้อ"
                            className="w-full rounded-xl border border-gray-200 px-4 py-3"
                          />
                        </div>

                        {/* รายละเอียด */}

                        <div className="mt-4">
                          <label className="mb-2 block text-sm font-semibold">
                            รายละเอียด
                          </label>

                          <textarea
                            value={
                              item.desc ||
                              ""
                            }
                            onChange={(e) =>
                              updateHighlight(
                                index,
                                "desc",
                                e.target
                                  .value,
                              )
                            }
                            rows={4}
                            placeholder="รายละเอียด"
                            className="w-full resize-none rounded-xl border border-gray-200 px-4 py-3"
                          />
                        </div>

                        <button
                          type="button"
                          onClick={() =>
                            removeHighlight(
                              index,
                            )
                          }
                          className="mt-4 text-sm font-semibold text-red-600"
                        >
                          ลบจุดเด่น
                        </button>
                      </div>
                    ),
                  )}
                </div>
              </div>
            )}

            {/* ================================= */}
            {/* CURRICULUM */}
            {/* ================================= */}

            {editing ===
              "curriculum" && (
              <div className="mt-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex rounded-xl bg-slate-100 p-1">
                    <button type="button" onClick={() => setCurriculumPlan("curriculum")} className={`rounded-lg px-4 py-2 text-sm font-bold ${curriculumPlan === "curriculum" ? "bg-[#7A0019] text-white shadow" : "text-slate-600"}`}>หลักสูตร 4 ปี</button>
                    <button type="button" onClick={() => setCurriculumPlan("curriculum_transfer")} className={`rounded-lg px-4 py-2 text-sm font-bold ${curriculumPlan === "curriculum_transfer" ? "bg-[#7A0019] text-white shadow" : "text-slate-600"}`}>หลักสูตรเทียบโอน</button>
                  </div>
                  <button
                    type="button"
                    onClick={
                      addCurriculum
                    }
                    className="rounded-xl bg-[#7A0019] px-4 py-2 text-sm font-semibold text-white"
                  >
                    + เพิ่มหมวดวิชา
                  </button>
                </div>

                <div className="mt-5 space-y-6">
                  {form[curriculumPlan].map(
                    (
                      group,
                      groupIndex,
                    ) => (
                      <div
                        key={
                          groupIndex
                        }
                        className="rounded-2xl border border-gray-200 p-5"
                      >
                        <div className="grid gap-3 md:grid-cols-[1fr_120px]">
                          <input
                            value={
                              group.category ||
                              ""
                            }
                            onChange={(e) =>
                              updateCurriculum(
                                groupIndex,
                                "category",
                                e.target
                                  .value,
                              )
                            }
                            placeholder="หมวดวิชา"
                            className="rounded-xl border px-4 py-3"
                          />

                          <input
                            type="number"
                            min="0"
                            value={
                              group.credits ??
                              0
                            }
                            onChange={(e) =>
                              updateCurriculum(
                                groupIndex,
                                "credits",
                                e.target
                                  .value,
                              )
                            }
                            placeholder="หน่วยกิต"
                            className="rounded-xl border px-4 py-3"
                          />
                        </div>

                        <div className="mt-4 space-y-3">
                          {(
                            group.subCategories ||
                            []
                          ).map(
                            (
                              sub,
                              subIndex,
                            ) => (
                              <div
                                key={
                                  subIndex
                                }
                                className="grid gap-3 md:grid-cols-[1fr_120px_auto]"
                              >
                                <input
                                  value={
                                    sub.name ||
                                    ""
                                  }
                                  onChange={(
                                    e,
                                  ) =>
                                    updateSubCategory(
                                      groupIndex,
                                      subIndex,
                                      "name",
                                      e.target
                                        .value,
                                    )
                                  }
                                  placeholder="ชื่อกลุ่มวิชา"
                                  className="rounded-xl border px-4 py-3"
                                />

                                <input
                                  type="number"
                                  min="0"
                                  value={
                                    sub.credits ??
                                    0
                                  }
                                  onChange={(
                                    e,
                                  ) =>
                                    updateSubCategory(
                                      groupIndex,
                                      subIndex,
                                      "credits",
                                      e.target
                                        .value,
                                    )
                                  }
                                  placeholder="หน่วยกิต"
                                  className="rounded-xl border px-4 py-3"
                                />

                                <button
                                  type="button"
                                  onClick={() =>
                                    removeSubCategory(
                                      groupIndex,
                                      subIndex,
                                    )
                                  }
                                  className="rounded-xl bg-red-50 px-4 py-2 text-sm font-semibold text-red-600"
                                >
                                  ลบ
                                </button>
                              </div>
                            ),
                          )}
                        </div>

                        <div className="mt-4 flex flex-wrap gap-3">
                          <button
                            type="button"
                            disabled={groupIndex === 0}
                            onClick={() => moveCurriculum(groupIndex, -1)}
                            className="rounded-xl bg-slate-100 px-4 py-2 text-sm font-semibold text-gray-700 disabled:opacity-40"
                          >
                            เลื่อนขึ้น
                          </button>
                          <button
                            type="button"
                            disabled={groupIndex === form[curriculumPlan].length - 1}
                            onClick={() => moveCurriculum(groupIndex, 1)}
                            className="rounded-xl bg-slate-100 px-4 py-2 text-sm font-semibold text-gray-700 disabled:opacity-40"
                          >
                            เลื่อนลง
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              addSubCategory(
                                groupIndex,
                              )
                            }
                            className="rounded-xl bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-700"
                          >
                            + เพิ่มกลุ่มวิชา
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              removeCurriculum(
                                groupIndex,
                              )
                            }
                            className="rounded-xl bg-red-50 px-4 py-2 text-sm font-semibold text-red-600"
                          >
                            ลบหมวด
                          </button>
                        </div>
                      </div>
                    ),
                  )}
                </div>
              </div>
            )}

            {/* ================================= */}
            {/* SKILLS */}
            {/* ================================= */}

            {editing ===
              "skills" && (
              <div className="mt-6">
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={addSkill}
                    className="rounded-xl bg-[#7A0019] px-4 py-2 text-sm font-semibold text-white"
                  >
                    เพิ่มทักษะ
                  </button>
                </div>

                <div className="mt-4 space-y-3">
                  {form.skills.map(
                    (
                      skill,
                      index,
                    ) => (
                      <div
                        key={index}
                        className="flex gap-3"
                      >
                        <input
                          value={
                            skill || ""
                          }
                          onChange={(e) =>
                            updateSkill(
                              index,
                              e.target
                                .value,
                            )
                          }
                          placeholder="ทักษะ"
                          className="flex-1 rounded-xl border px-4 py-3"
                        />

                        <button
                          type="button"
                          onClick={() =>
                            removeSkill(
                              index,
                            )
                          }
                          className="rounded-xl bg-red-50 px-4 text-sm font-semibold text-red-600"
                        >
                          ลบ
                        </button>
                      </div>
                    ),
                  )}
                </div>
              </div>
            )}

            {/* ================================= */}
            {/* CAREERS */}
            {/* ================================= */}

            {editing ===
              "careers" && (
              <div className="mt-6">
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={addCareer}
                    className="rounded-xl bg-[#7A0019] px-4 py-2 text-sm font-semibold text-white"
                  >
                    เพิ่มอาชีพ
                  </button>
                </div>

                <div className="mt-4 space-y-3">
                  {form.careers.map(
                    (
                      career,
                      index,
                    ) => (
                      <div
                        key={index}
                        className="grid gap-3 rounded-2xl border border-gray-200 p-3 md:grid-cols-[130px_1fr_auto]"
                      >

                        <label className="flex min-h-12 cursor-pointer items-center justify-center overflow-hidden rounded-xl border border-dashed border-gray-300 bg-gray-50 text-xs font-semibold text-gray-500 hover:border-[#7A0019] hover:text-[#7A0019]">
                          {careerImagePreviews[index] || career.image ? (
                            <img
                              src={careerImagePreviews[index] || getImageUrl(career.image)}
                              alt={career.title || "ตัวอย่างรูปอาชีพ"}
                              className="h-16 w-full object-cover"
                            />
                          ) : (
                            "เพิ่มรูป"
                          )}
                          <input
                            type="file"
                            accept="image/jpeg,image/png,image/webp,image/jpg"
                            onChange={(e) => handleCareerImageChange(index, e)}
                            className="sr-only"
                          />
                        </label>

                        <input
                          value={
                            career.title ||
                            ""
                          }
                          onChange={(e) =>
                            updateCareer(
                              index,
                              "title",
                              e.target
                                .value,
                            )
                          }
                          placeholder="ตำแหน่งงาน"
                          className="rounded-xl border px-4 py-3"
                        />

                        <input
                          value={career.description || ""}
                          onChange={(e) =>
                            updateCareer(
                              index,
                              "description",
                              e.target.value,
                            )
                          }
                          placeholder="คำอธิบายสั้นของอาชีพ (ไม่บังคับ)"
                          className="rounded-xl border px-4 py-3 md:col-start-2"
                        />

                        <button
                          type="button"
                          onClick={() =>
                            removeCareer(
                              index,
                            )
                          }
                          className="rounded-xl bg-red-50 px-4 text-sm font-semibold text-red-600"
                        >
                          ลบ
                        </button>
                      </div>
                    ),
                  )}
                </div>
              </div>
            )}

            {editing === "atmosphere" && (
              <div className="mt-6">
                <div className="flex justify-end">
                  <button type="button" onClick={addAtmosphere} className="rounded-xl bg-[#7A0019] px-4 py-2 font-semibold text-white">เพิ่มรูปภาพ</button>
                </div>
                <div className="mt-4 space-y-4">
                  {form.learning_environment.map((item, index) => (
                    <div key={index} className="rounded-2xl border border-gray-200 p-4">
                      <label className="inline-flex cursor-pointer items-center rounded-xl bg-[#7A0019] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#5C0013]">
                        เลือกรูปภาพ
                        <input type="file" accept="image/jpeg,image/png,image/webp,image/jpg" onChange={(e) => handleAtmosphereImageChange(index, e)} className="sr-only" />
                      </label>
                      <span className="ml-3 text-sm text-gray-500">
                        {atmosphereImageFiles[index]?.name || (item.image ? "มีรูปภาพแล้ว" : "ยังไม่ได้เลือกรูปภาพ")}
                      </span>
                      <p className="mt-2 text-xs text-gray-500">
                        แนะนำภาพแนวนอน 1920 × 1080 px (16:9) · JPG, PNG หรือ WebP · ไม่เกิน 5MB
                      </p>
                      {(atmosphereImagePreviews[index] || item.image) && <img src={atmosphereImagePreviews[index] || getImageUrl(item.image)} alt="ตัวอย่าง" className="mt-3 h-36 w-full rounded-xl object-cover" />}
                      <input value={item.title || ""} onChange={(e) => updateAtmosphere(index, "title", e.target.value)} placeholder="หัวข้อภาพ" className="mt-3 w-full rounded-xl border px-4 py-3" />
                      <textarea value={item.description || ""} onChange={(e) => updateAtmosphere(index, "description", e.target.value)} placeholder="คำบรรยายสั้น ๆ" rows={3} className="mt-3 w-full rounded-xl border px-4 py-3" />
                      <button type="button" onClick={() => removeAtmosphere(index)} className="mt-3 text-sm font-semibold text-red-600">ลบรูปนี้</button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ================================= */}
            {/* Modal Buttons */}
            {/* ================================= */}

            <div className="mt-8 flex justify-end gap-3 border-t pt-5">
              <button
                type="button"
                onClick={() =>
                  setEditing(null)
                }
                className="rounded-xl border border-gray-200 px-5 py-3 font-semibold text-gray-600 hover:bg-gray-50"
              >
                ยกเลิก
              </button>

              <button
                type="button"
                onClick={
                  handleSave
                }
                disabled={saving}
                className="rounded-xl bg-[#7A0019] px-6 py-3 font-bold text-white hover:bg-[#5C0013] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving
                  ? "กำลังบันทึก..."
                  : "บันทึก"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ProgramEditor;
