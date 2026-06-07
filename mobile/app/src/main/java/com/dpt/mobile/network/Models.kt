package com.dpt.mobile.network

import com.squareup.moshi.Json
import com.squareup.moshi.JsonClass

// DTO-моделі для REST API. Назви полів відповідають контракту бекенда.

// --- Авторизація ---

@JsonClass(generateAdapter = true)
data class LoginRequest(
    val username: String,
    val password: String
)

@JsonClass(generateAdapter = true)
data class LoginResponse(
    val token: String,
    val user: User
)

@JsonClass(generateAdapter = true)
data class User(
    val id: String,
    val name: String,
    val role: String // "admin" або "teacher"
)

// --- Групи ---

@JsonClass(generateAdapter = true)
data class Group(
    @Json(name = "_id") val id: String,
    val name: String,
    val style: String,
    val level: String
)

// --- Студенти ---

@JsonClass(generateAdapter = true)
data class Student(
    @Json(name = "_id") val id: String,
    val group: String,
    val lastName: String,
    val firstName: String
) {
    val fullName: String get() = "$lastName $firstName"
}

// --- Статистика ---

@JsonClass(generateAdapter = true)
data class StudentStat(
    val studentId: String,
    val lastName: String,
    val firstName: String,
    val absences: Int,
    val average: Double? // null, якщо в учня ще немає оцінок
) {
    val fullName: String get() = "$lastName $firstName"
}

// --- Створення заняття (відвідуваність + оцінки) ---

@JsonClass(generateAdapter = true)
data class LessonRequest(
    val group: String,
    val date: String, // формат "YYYY-MM-DD"
    val records: List<AttendanceRecord>
)

@JsonClass(generateAdapter = true)
data class AttendanceRecord(
    val student: String,
    val present: Boolean,
    val grade: Int? // null, якщо оцінки немає або студент відсутній
)

// --- Заняття (повертається з GET /groups/{id}/lessons) ---

@JsonClass(generateAdapter = true)
data class Lesson(
    @Json(name = "_id") val id: String,
    val group: String,
    val date: String, // "YYYY-MM-DD"
    val records: List<AttendanceRecord>
) {
    val presentCount: Int get() = records.count { it.present }
}
