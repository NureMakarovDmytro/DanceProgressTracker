package com.dpt.mobile.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.dpt.mobile.data.Repository
import com.dpt.mobile.network.AttendanceRecord
import com.dpt.mobile.network.Group
import com.dpt.mobile.network.Lesson
import com.dpt.mobile.network.Student
import com.dpt.mobile.network.StudentStat
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

// Рядок редактора відвідуваності для одного учня.
data class AttendanceRow(
    val student: Student,
    val present: Boolean = true,
    val grade: Int? = null
)

// Єдина ViewModel застосунку: тримає стан і викликає репозиторій у viewModelScope.
class AppViewModel(
    private val repo: Repository = Repository()
) : ViewModel() {

    // --- Спільні поля стану ---
    private val _loading = MutableStateFlow(false)
    val loading: StateFlow<Boolean> = _loading.asStateFlow()

    private val _error = MutableStateFlow<String?>(null)
    val error: StateFlow<String?> = _error.asStateFlow()

    // --- Авторизація ---
    private val _loggedIn = MutableStateFlow(false)
    val loggedIn: StateFlow<Boolean> = _loggedIn.asStateFlow()

    val userName: String? get() = repo.userName
    val userRole: String? get() = repo.userRole

    // --- Групи ---
    private val _groups = MutableStateFlow<List<Group>>(emptyList())
    val groups: StateFlow<List<Group>> = _groups.asStateFlow()

    // Поточна група (встановлюється при відкритті екрана занять).
    private var currentGroupId: String = ""

    // --- Учні поточної групи ---
    private val _students = MutableStateFlow<List<Student>>(emptyList())
    val students: StateFlow<List<Student>> = _students.asStateFlow()

    // --- Заняття поточної групи ---
    private val _lessons = MutableStateFlow<List<Lesson>>(emptyList())
    val lessons: StateFlow<List<Lesson>> = _lessons.asStateFlow()

    // --- Редактор заняття ---
    private val _rows = MutableStateFlow<List<AttendanceRow>>(emptyList())
    val rows: StateFlow<List<AttendanceRow>> = _rows.asStateFlow()

    private val _editingDate = MutableStateFlow(today())
    val editingDate: StateFlow<String> = _editingDate.asStateFlow()

    private var editingLessonId: String? = null
    val isEditing: Boolean get() = editingLessonId != null

    private val _submitted = MutableStateFlow(false)
    val submitted: StateFlow<Boolean> = _submitted.asStateFlow()

    // --- Статистика ---
    private val _stats = MutableStateFlow<List<StudentStat>>(emptyList())
    val stats: StateFlow<List<StudentStat>> = _stats.asStateFlow()

    fun clearError() { _error.value = null }

    // --- Авторизація ---
    fun login(username: String, password: String) {
        launchSafe {
            repo.login(username, password)
            _loggedIn.value = true
            loadGroups()
        }
    }

    fun loadGroups() {
        launchSafe { _groups.value = repo.getGroups() }
    }

    // --- Відкриття групи: вантажимо учнів і заняття ---
    fun openGroup(groupId: String) {
        currentGroupId = groupId
        _submitted.value = false
        launchSafe {
            _students.value = repo.getStudents(groupId)
            _lessons.value = repo.getLessons(groupId).sortedByDescending { it.date }
        }
    }

    fun loadStats(groupId: String = currentGroupId) {
        launchSafe { _stats.value = repo.getStats(groupId) }
    }

    // --- Редактор: нове заняття на задану дату ---
    fun startNewLesson(date: String) {
        editingLessonId = null
        _editingDate.value = date
        _submitted.value = false
        _rows.value = _students.value.map { AttendanceRow(it, present = true, grade = null) }
    }

    // --- Редактор: редагування наявного заняття ---
    fun startEditLesson(lesson: Lesson) {
        editingLessonId = lesson.id
        _editingDate.value = lesson.date
        _submitted.value = false
        _rows.value = _students.value.map { s ->
            val rec = lesson.records.find { it.student == s.id }
            AttendanceRow(s, present = rec?.present ?: false, grade = rec?.grade)
        }
    }

    fun togglePresent(studentId: String, present: Boolean) {
        _rows.value = _rows.value.map { row ->
            if (row.student.id == studentId)
                row.copy(present = present, grade = if (present) row.grade else null)
            else row
        }
    }

    fun setGrade(studentId: String, grade: Int?) {
        _rows.value = _rows.value.map { row ->
            if (row.student.id == studentId) row.copy(grade = grade) else row
        }
    }

    // Зберегти заняття (створення або оновлення — бекенд робить upsert за group+date).
    fun submitLesson(onDone: () -> Unit) {
        val records = _rows.value.map {
            AttendanceRecord(student = it.student.id, present = it.present, grade = it.grade)
        }
        launchSafe {
            repo.submitLesson(currentGroupId, _editingDate.value, records)
            _submitted.value = true
            _lessons.value = repo.getLessons(currentGroupId).sortedByDescending { it.date }
            onDone()
        }
    }

    // Видалити заняття за id (зі списку або з календаря).
    fun deleteLesson(lessonId: String, onDone: () -> Unit = {}) {
        launchSafe {
            repo.deleteLesson(lessonId)
            _lessons.value = repo.getLessons(currentGroupId).sortedByDescending { it.date }
            onDone()
        }
    }

    // Видалити заняття, що зараз редагується (з екрана редактора).
    fun deleteCurrentLesson(onDone: () -> Unit) {
        val id = editingLessonId ?: return
        deleteLesson(id, onDone)
    }

    private fun today(): String =
        SimpleDateFormat("yyyy-MM-dd", Locale.US).format(Date())

    // Обгортка: керує прапорцем завантаження та перехоплює помилки.
    private fun launchSafe(block: suspend () -> Unit) {
        viewModelScope.launch {
            _loading.value = true
            _error.value = null
            try {
                block()
            } catch (e: Exception) {
                _error.value = e.message ?: "Сталася помилка"
            } finally {
                _loading.value = false
            }
        }
    }
}
