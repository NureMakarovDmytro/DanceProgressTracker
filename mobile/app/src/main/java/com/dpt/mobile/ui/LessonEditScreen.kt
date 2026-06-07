package com.dpt.mobile.ui

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.DropdownMenu
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Switch
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.unit.dp
import com.dpt.mobile.R
import com.dpt.mobile.viewmodel.AppViewModel
import com.dpt.mobile.viewmodel.AttendanceRow

// Редактор заняття: дата + список учнів (присутність + оцінка). Зберігає або видаляє заняття.
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun LessonEditScreen(
    vm: AppViewModel,
    onBack: () -> Unit
) {
    val rows by vm.rows.collectAsState()
    val date by vm.editingDate.collectAsState()
    val loading by vm.loading.collectAsState()
    val error by vm.error.collectAsState()
    val editing = vm.isEditing

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Text(stringResource(if (editing) R.string.edit_lesson else R.string.new_lesson))
                },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = null)
                    }
                }
            )
        }
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .padding(16.dp)
        ) {
            Text(
                text = stringResource(R.string.lesson_date, date),
                style = MaterialTheme.typography.titleMedium,
                modifier = Modifier.padding(bottom = 8.dp)
            )

            if (loading) CircularProgressIndicator(modifier = Modifier.padding(8.dp))
            error?.let {
                Text(it, color = MaterialTheme.colorScheme.error, modifier = Modifier.padding(8.dp))
            }

            LazyColumn(modifier = Modifier.weight(1f)) {
                items(rows) { row ->
                    StudentRow(
                        row = row,
                        onTogglePresent = { vm.togglePresent(row.student.id, it) },
                        onGradeSelected = { vm.setGrade(row.student.id, it) }
                    )
                }
            }

            Button(
                onClick = { vm.submitLesson { onBack() } },
                enabled = !loading && rows.isNotEmpty(),
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(top = 8.dp)
            ) {
                Text(stringResource(R.string.save_lesson))
            }

            if (editing) {
                TextButton(
                    onClick = { vm.deleteCurrentLesson { onBack() } },
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Text(stringResource(R.string.delete_lesson), color = MaterialTheme.colorScheme.error)
                }
            }
        }
    }
}

@Composable
private fun StudentRow(
    row: AttendanceRow,
    onTogglePresent: (Boolean) -> Unit,
    onGradeSelected: (Int?) -> Unit
) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 4.dp)
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(12.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            Text(
                text = row.student.fullName,
                style = MaterialTheme.typography.bodyLarge,
                modifier = Modifier.weight(1f)
            )
            if (row.present) {
                GradePicker(grade = row.grade, onGradeSelected = onGradeSelected)
            }
            Switch(checked = row.present, onCheckedChange = onTogglePresent)
        }
    }
}

@Composable
private fun GradePicker(grade: Int?, onGradeSelected: (Int?) -> Unit) {
    var expanded by remember { mutableStateOf(false) }

    OutlinedButton(onClick = { expanded = true }) {
        Text(grade?.toString() ?: stringResource(R.string.grade_placeholder))
    }
    DropdownMenu(expanded = expanded, onDismissRequest = { expanded = false }) {
        DropdownMenuItem(
            text = { Text(stringResource(R.string.grade_none)) },
            onClick = { onGradeSelected(null); expanded = false }
        )
        (1..12).forEach { value ->
            DropdownMenuItem(
                text = { Text(value.toString()) },
                onClick = { onGradeSelected(value); expanded = false }
            )
        }
    }
}
