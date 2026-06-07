package com.dpt.mobile.data

import com.dpt.mobile.network.AttendanceRecord
import com.dpt.mobile.network.Group
import com.dpt.mobile.network.Lesson
import com.dpt.mobile.network.LessonRequest
import com.dpt.mobile.network.LoginRequest
import com.dpt.mobile.network.LoginResponse
import com.dpt.mobile.network.RetrofitClient
import com.dpt.mobile.network.Student
import com.dpt.mobile.network.StudentStat

// Репозиторій інкапсулює доступ до мережі та зберігає JWT у пам'яті.
// ViewModel працює тільки з репозиторієм, а не з Retrofit напряму.
class Repository {

    private val api = RetrofitClient.api

    // JWT і дані користувача тримаємо в пам'яті (in-memory) для простоти.
    var token: String? = null
        private set
    var userName: String? = null
        private set
    var userRole: String? = null
        private set

    private fun authHeader(): String = "Bearer ${token.orEmpty()}"

    suspend fun login(username: String, password: String): LoginResponse {
        val resp = api.login(LoginRequest(username, password))
        token = resp.token
        userName = resp.user.name
        userRole = resp.user.role
        return resp
    }

    suspend fun getGroups(): List<Group> =
        api.getGroups(authHeader())

    suspend fun getStudents(groupId: String): List<Student> =
        api.getStudents(authHeader(), groupId)

    suspend fun getStats(groupId: String): List<StudentStat> =
        api.getStats(authHeader(), groupId)

    suspend fun getLessons(groupId: String): List<Lesson> =
        api.getLessons(authHeader(), groupId)

    suspend fun submitLesson(groupId: String, date: String, records: List<AttendanceRecord>) {
        api.createLesson(authHeader(), LessonRequest(groupId, date, records))
    }

    suspend fun deleteLesson(lessonId: String) {
        api.deleteLesson(authHeader(), lessonId)
    }
}
