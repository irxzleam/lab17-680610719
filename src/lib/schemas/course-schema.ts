import { z } from "zod";

import type { Course } from "@/lib/types";

export const MAX_INSTRUCTORS = 3;
export const MAX_DESCRIPTION = 100;
const CMU_DOMAIN = "@cmu.ac.th";
const EMAIL_MESSAGE = "ต้องเป็นอีเมล @cmu.ac.th";

// ใช้ร่วมกันระหว่างฟอร์มกับตาราง (แสดง label)
export const programOptions = [
  { value: "CPE", label: "CPE — วิศวกรรมคอมพิวเตอร์" },
  { value: "ISNE", label: "ISNE — วิศวกรรมระบบสารสนเทศและเครือข่าย" },
];

export const semesterOptions = [
  { value: "1", label: "ภาคการศึกษาที่ 1" },
  { value: "2", label: "ภาคการศึกษาที่ 2" },
  { value: "3", label: "ภาคฤดูร้อน" },
];

// ตรวจทีละแถวของผู้สอน
const instructorSchema = z.object({
  name: z.string().trim().min(1, "กรอกชื่อผู้สอน"),
  email: z
    .string()
    .trim()
    .pipe(
      z
        .email(EMAIL_MESSAGE)
        .refine((v) => v.toLowerCase().endsWith(CMU_DOMAIN), EMAIL_MESSAGE),
    ),
});

/**
 * ต้องสร้างใหม่เมื่อ courses เปลี่ยน (ผ่าน useMemo ใน component)
 * เพื่อให้ .refine() กันรหัสซ้ำเห็นข้อมูลล่าสุด
 */
export function createCourseFormSchema(existingCourses: Course[]) {
  return z.object({
    courseId: z
      .string()
      .trim()
      .regex(/^\d{6}$/, "รหัสวิชาต้องเป็นตัวเลข 6 หลัก")
      .refine(
        (id) => !existingCourses.some((c) => c.courseId === id),
        "รหัสวิชานี้มีอยู่แล้ว",
      ),
    courseTitle: z
      .string()
      .trim()
      .min(1, "กรอกชื่อวิชา")
      .max(100, "ชื่อวิชายาวได้ไม่เกิน 100 ตัวอักษร"),
    program: z.enum(["CPE", "ISNE"], { message: "เลือกหลักสูตร" }),
    semester: z.enum(["1", "2", "3"], { message: "เลือกภาคการศึกษา" }),
    description: z
      .string()
      .max(MAX_DESCRIPTION, `รายละเอียดยาวได้ไม่เกิน ${MAX_DESCRIPTION} ตัวอักษร`),
    instructors: z
      .array(instructorSchema)
      .min(1, "ต้องมีผู้สอนอย่างน้อย 1 คน")
      .max(MAX_INSTRUCTORS, `มีผู้สอนได้ไม่เกิน ${MAX_INSTRUCTORS} คน`)
      // Array Validation: อีเมลผู้สอนห้ามซ้ำกัน
      .refine(
        (items) =>
          new Set(items.map((i) => i.email.toLowerCase())).size ===
          items.length,
        "อีเมลผู้สอนซ้ำกัน",
      ),
    notifyByEmail: z.boolean(),
  });
}

// ได้ type จาก schema ตรงๆ — ไม่ประกาศ CourseFormValues ซ้ำเอง
export type CourseFormValues = z.infer<
  ReturnType<typeof createCourseFormSchema>
>;
