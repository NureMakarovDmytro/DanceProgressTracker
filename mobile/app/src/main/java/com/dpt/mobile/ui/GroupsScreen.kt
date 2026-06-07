package com.dpt.mobile.ui

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.Card
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.unit.dp
import com.dpt.mobile.R
import com.dpt.mobile.network.Group
import com.dpt.mobile.viewmodel.AppViewModel

// Екран зі списком груп: GET /groups. Натиск на групу -> екран відвідуваності.
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun GroupsScreen(vm: AppViewModel, onGroupClick: (Group) -> Unit) {
    val groups by vm.groups.collectAsState()
    val loading by vm.loading.collectAsState()
    val error by vm.error.collectAsState()

    // Перезавантажуємо групи при відкритті екрана.
    LaunchedEffect(Unit) { vm.loadGroups() }

    Scaffold(
        topBar = { TopAppBar(title = { Text(stringResource(R.string.groups_title)) }) }
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .padding(16.dp)
        ) {
            if (loading) {
                CircularProgressIndicator(modifier = Modifier.padding(8.dp))
            }
            error?.let {
                Text(text = it, color = MaterialTheme.colorScheme.error, modifier = Modifier.padding(8.dp))
            }

            LazyColumn {
                items(groups) { group ->
                    Card(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(vertical = 6.dp)
                            .clickable { onGroupClick(group) }
                    ) {
                        Column(modifier = Modifier.padding(16.dp)) {
                            Text(text = group.name, style = MaterialTheme.typography.titleMedium)
                            Text(
                                text = stringResource(R.string.group_subtitle, group.style, group.level),
                                style = MaterialTheme.typography.bodySmall
                            )
                        }
                    }
                }
            }

            if (!loading && groups.isEmpty() && error == null) {
                Text(
                    text = stringResource(R.string.empty_groups),
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(top = 24.dp),
                    style = MaterialTheme.typography.bodyMedium
                )
            }
        }
    }
}
