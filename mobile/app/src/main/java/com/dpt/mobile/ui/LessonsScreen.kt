package com.dpt.mobile.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import com.dpt.mobile.R
import com.dpt.mobile.network.Lesson
import com.dpt.mobile.viewmodel.AppViewModel
import java.text.SimpleDateFormat
import java.util.Calendar
import java.util.Date
import java.util.Locale

private fun todayStr(): String = SimpleDateFormat("yyyy-MM-dd", Locale.US).format(Date())

private fun fmtDate(iso: String): String = try {
    val d = SimpleDateFormat("yyyy-MM-dd", Locale.US).parse(iso)
    SimpleDateFormat("dd.MM.yyyy", Locale("uk")).format(d!!)
} catch (e: Exception) {
    iso
}

// Екран групи: календар занять + список занять. Звідси переходимо в редактор і статистику.
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun LessonsScreen(
    vm: AppViewModel,
    groupId: String,
    groupName: String,
    onBack: () -> Unit,
    onOpenStats: () -> Unit,
    onOpenEditor: () -> Unit
) {
    val lessons by vm.lessons.collectAsState()
    val loading by vm.loading.collectAsState()
    val error by vm.error.collectAsState()

    LaunchedEffect(groupId) { vm.openGroup(groupId) }

    val nowCal = remember { Calendar.getInstance() }
    var year by remember { mutableStateOf(nowCal.get(Calendar.YEAR)) }
    var month by remember { mutableStateOf(nowCal.get(Calendar.MONTH)) } // 0..11
    var pendingDelete by remember { mutableStateOf<Lesson?>(null) }

    val lessonDates = lessons.map { it.date }.toSet()

    fun openDate(ds: String) {
        val existing = lessons.find { it.date == ds }
        if (existing != null) vm.startEditLesson(existing) else vm.startNewLesson(ds)
        onOpenEditor()
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text(groupName) },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = null)
                    }
                }
            )
        }
    ) { padding ->
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .padding(horizontal = 16.dp)
        ) {
            item {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(vertical = 8.dp),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    OutlinedButton(onClick = onOpenStats, modifier = Modifier.weight(1f)) {
                        Text(stringResource(R.string.open_stats))
                    }
                    Button(
                        onClick = { vm.startNewLesson(todayStr()); onOpenEditor() },
                        modifier = Modifier.weight(1f)
                    ) {
                        Text(stringResource(R.string.add_lesson))
                    }
                }
            }

            if (loading) item { CircularProgressIndicator(modifier = Modifier.padding(8.dp)) }
            error?.let { e -> item { Text(e, color = MaterialTheme.colorScheme.error, modifier = Modifier.padding(8.dp)) } }

            item {
                Text(
                    stringResource(R.string.calendar_title),
                    style = MaterialTheme.typography.titleMedium,
                    modifier = Modifier.padding(vertical = 8.dp)
                )
            }
            item {
                Card(modifier = Modifier.fillMaxWidth()) {
                    Box(modifier = Modifier.padding(12.dp)) {
                        MonthCalendar(
                            year = year,
                            month = month,
                            lessonDates = lessonDates,
                            onPrev = { if (month == 0) { month = 11; year-- } else month-- },
                            onNext = { if (month == 11) { month = 0; year++ } else month++ },
                            onPick = { openDate(it) }
                        )
                    }
                }
            }

            item {
                Text(
                    stringResource(R.string.lessons_section),
                    style = MaterialTheme.typography.titleMedium,
                    modifier = Modifier.padding(top = 16.dp, bottom = 8.dp)
                )
            }
            if (lessons.isEmpty() && !loading) {
                item {
                    Text(
                        stringResource(R.string.no_lessons),
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                        modifier = Modifier.padding(8.dp)
                    )
                }
            }
            items(lessons) { lesson ->
                Card(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(vertical = 4.dp)
                        .clickable { vm.startEditLesson(lesson); onOpenEditor() }
                ) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(16.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column(modifier = Modifier.weight(1f)) {
                            Text(fmtDate(lesson.date), style = MaterialTheme.typography.bodyLarge)
                            Text(
                                stringResource(R.string.present_of, lesson.presentCount, lesson.records.size),
                                style = MaterialTheme.typography.bodySmall,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }
                        TextButton(onClick = { pendingDelete = lesson }) {
                            Text(stringResource(R.string.delete_lesson), color = MaterialTheme.colorScheme.error)
                        }
                    }
                }
            }

            item { Spacer(modifier = Modifier.height(24.dp)) }
        }
    }

    pendingDelete?.let { l ->
        AlertDialog(
            onDismissRequest = { pendingDelete = null },
            title = { Text(stringResource(R.string.delete_lesson)) },
            text = { Text(fmtDate(l.date)) },
            confirmButton = {
                TextButton(onClick = { vm.deleteLesson(l.id); pendingDelete = null }) { Text("OK") }
            },
            dismissButton = {
                TextButton(onClick = { pendingDelete = null }) { Text("Скасувати") }
            }
        )
    }
}

// Простий місячний календар (Пн-перший). Дні із заняттями підсвічені.
@Composable
private fun MonthCalendar(
    year: Int,
    month: Int,
    lessonDates: Set<String>,
    onPrev: () -> Unit,
    onNext: () -> Unit,
    onPick: (String) -> Unit
) {
    val monthNames = listOf(
        "Січень", "Лютий", "Березень", "Квітень", "Травень", "Червень",
        "Липень", "Серпень", "Вересень", "Жовтень", "Листопад", "Грудень"
    )
    val cal = Calendar.getInstance()
    cal.clear()
    cal.set(year, month, 1)
    val daysInMonth = cal.getActualMaximum(Calendar.DAY_OF_MONTH)
    val firstDow = cal.get(Calendar.DAY_OF_WEEK) // 1=Нд .. 7=Сб
    val offset = (firstDow + 5) % 7              // зсув для Пн-першого тижня

    val cells = ArrayList<Int?>()
    repeat(offset) { cells.add(null) }
    for (d in 1..daysInMonth) cells.add(d)
    while (cells.size % 7 != 0) cells.add(null)
    val weeks = cells.chunked(7)

    Column(modifier = Modifier.fillMaxWidth()) {
        // Заголовок: < Місяць Рік >
        Row(verticalAlignment = Alignment.CenterVertically) {
            TextButton(onClick = onPrev) { Text("<") }
            Text(
                text = "${monthNames[month]} $year",
                modifier = Modifier.weight(1f),
                textAlign = TextAlign.Center,
                style = MaterialTheme.typography.titleMedium
            )
            TextButton(onClick = onNext) { Text(">") }
        }
        // Дні тижня
        Row(modifier = Modifier.fillMaxWidth()) {
            listOf("Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Нд").forEach {
                Text(
                    text = it,
                    modifier = Modifier.weight(1f),
                    textAlign = TextAlign.Center,
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
        }
        // Тижні
        weeks.forEach { week ->
            Row(modifier = Modifier.fillMaxWidth()) {
                week.forEach { day ->
                    Box(
                        modifier = Modifier
                            .weight(1f)
                            .height(44.dp)
                            .padding(2.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        if (day != null) {
                            val ds = String.format(Locale.US, "%04d-%02d-%02d", year, month + 1, day)
                            val hasLesson = lessonDates.contains(ds)
                            Box(
                                modifier = Modifier
                                    .size(36.dp)
                                    .clip(CircleShape)
                                    .background(
                                        if (hasLesson) MaterialTheme.colorScheme.primary else Color.Transparent
                                    )
                                    .clickable { onPick(ds) },
                                contentAlignment = Alignment.Center
                            ) {
                                Text(
                                    text = day.toString(),
                                    color = if (hasLesson) MaterialTheme.colorScheme.onPrimary
                                    else MaterialTheme.colorScheme.onSurface,
                                    style = MaterialTheme.typography.bodyMedium
                                )
                            }
                        }
                    }
                }
            }
        }
    }
}
