package com.dpt.mobile

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import com.dpt.mobile.ui.GroupsScreen
import com.dpt.mobile.ui.LessonEditScreen
import com.dpt.mobile.ui.LessonsScreen
import com.dpt.mobile.ui.LoginScreen
import com.dpt.mobile.ui.StatsScreen
import com.dpt.mobile.viewmodel.AppViewModel

// Єдина Activity застосунку. Уся навігація — через Navigation Compose.
class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            MaterialTheme {
                Surface {
                    AppNavGraph()
                }
            }
        }
    }
}

// Маршрути застосунку.
private object Routes {
    const val LOGIN = "login"
    const val GROUPS = "groups"
    const val LESSONS = "lessons/{groupId}/{groupName}"
    const val EDITOR = "editor"
    const val STATS = "stats/{groupId}/{groupName}"

    fun lessons(id: String, name: String) = "lessons/$id/$name"
    fun stats(id: String, name: String) = "stats/$id/$name"
}

@Composable
private fun AppNavGraph() {
    val navController = rememberNavController()
    // Одна ViewModel на весь граф — спільний стан між екранами.
    val vm: AppViewModel = viewModel()

    val loggedIn by vm.loggedIn.collectAsState()
    val start = if (loggedIn) Routes.GROUPS else Routes.LOGIN

    NavHost(navController = navController, startDestination = start) {

        composable(Routes.LOGIN) {
            LoginScreen(vm = vm)
            val isLogged by vm.loggedIn.collectAsState()
            LaunchedEffect(isLogged) {
                if (isLogged) {
                    navController.navigate(Routes.GROUPS) {
                        popUpTo(Routes.LOGIN) { inclusive = true }
                    }
                }
            }
        }

        composable(Routes.GROUPS) {
            GroupsScreen(
                vm = vm,
                onGroupClick = { group ->
                    navController.navigate(Routes.lessons(group.id, group.name))
                }
            )
        }

        composable(Routes.LESSONS) { backStack ->
            val groupId = backStack.arguments?.getString("groupId").orEmpty()
            val groupName = backStack.arguments?.getString("groupName").orEmpty()
            LessonsScreen(
                vm = vm,
                groupId = groupId,
                groupName = groupName,
                onBack = { navController.popBackStack() },
                onOpenStats = { navController.navigate(Routes.stats(groupId, groupName)) },
                onOpenEditor = { navController.navigate(Routes.EDITOR) }
            )
        }

        composable(Routes.EDITOR) {
            LessonEditScreen(
                vm = vm,
                onBack = { navController.popBackStack() }
            )
        }

        composable(Routes.STATS) { backStack ->
            val groupId = backStack.arguments?.getString("groupId").orEmpty()
            val groupName = backStack.arguments?.getString("groupName").orEmpty()
            StatsScreen(
                vm = vm,
                groupId = groupId,
                groupName = groupName,
                onBack = { navController.popBackStack() }
            )
        }
    }
}
