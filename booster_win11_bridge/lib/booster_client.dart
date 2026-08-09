import 'package:http/http.dart' as http;
import 'dart:convert';

class BoosterWin11Client {
final String baseUrl;

BoosterWin11Client({this.baseUrl = "http://localhost:5173"});

Future<Map<String, dynamic>> getSystemStatus() async {
final response = await http.get(Uri.parse('$baseUrl/api/win11/shell/status'));
if (response.statusCode == 200) {
return jsonDecode(response.body);
} else {
throw Exception('Järjestelmän tilan haku epäonnistui: ${response.statusCode}');
}
}

Future<Map<String, dynamic>> executeShellCommand(String command) async {
final response = await http.post(
Uri.parse('$baseUrl/api/win11/shell-driver/exec'),
headers: {'Content-Type': 'application/json'},
body: jsonEncode({'command': command}),
);
if (response.statusCode == 200) {
return jsonDecode(response.body);
} else {
throw Exception('Komennon suoritus epäonnistui: ${response.statusCode}');
}
}

Future<Map<String, dynamic>> launchWin32App(String appName) async {
final response = await http.post(
Uri.parse('$baseUrl/api/win11/win32/launch'),
headers: {'Content-Type': 'application/json'},
body: jsonEncode({'app': appName}),
);
if (response.statusCode == 200) {
return jsonDecode(response.body);
} else {
throw Exception('Sovelluksen käynnistys epäonnistui: ${response.statusCode}');
}
}
}
