package com.dpt.mobile.network

import okhttp3.ResponseBody
import retrofit2.Response
import retrofit2.http.Body
import retrofit2.http.DELETE
import retrofit2.http.GET
import retrofit2.http.Header
import retrofit2.http.POST
import retrofit2.http.Path

// Опис REST-ендпоінтів бекенда DanceProgressTracker.
// Захищені виклики потребують заголовка Authorization: Bearer <token>.
interface ApiService {

    @POST("auth/login")
    suspend fun login(@Body body: LoginRequest): LoginResponse

    @GET("groups")
    suspend fun getGroups(@Header("Authorization") auth: String): List<Group>

    @GET("groups/{id}/students")
    suspend fun getStudents(
        @Header("Authorization") auth: String,
        @Path("id") groupId: String
    ): List<Student>

    @GET("groups/{id}/stats")
    suspend fun getStats(
        @Header("Authorization") auth: String,
        @Path("id") groupId: String
    ): List<StudentStat>

    @GET("groups/{id}/lessons")
    suspend fun getLessons(
        @Header("Authorization") auth: String,
        @Path("id") groupId: String
    ): List<Lesson>

    @POST("lessons")
    suspend fun createLesson(
        @Header("Authorization") auth: String,
        @Body body: LessonRequest
    ): ResponseBody // тіло відповіді (створене заняття) в UI не парситься

    @DELETE("lessons/{id}")
    suspend fun deleteLesson(
        @Header("Authorization") auth: String,
        @Path("id") lessonId: String
    ): Response<Unit>
}
