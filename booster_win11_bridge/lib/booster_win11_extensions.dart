import 'package:http/http.dart' as http;
import 'dart:convert';

class BoosterWin11Extensions {
final String baseUrl;

BoosterWin11Extensions({this.baseUrl = "http://localhost:5173"});

Future<Map<String, dynamic>> toggleQuickSetting(String key) async {
final response = await http.post(
Uri.parse('$baseUrl/api/win11/quick-settings/toggle'),
headers: {'Content-Type': 'application/json'},
body: jsonEncode({'key': key}),
);
if (response.statusCode == 200) {
return jsonDecode(response.body);
} else {
throw Exception('Pika-asetuksen vaihto epäonnistui: ${response.statusCode}');
}
}

Future<Map<String, dynamic>> queryRegistry(String path) async {
final response = await http.post(
Uri.parse('$baseUrl/api/win11/modules/registry'),
headers: {'Content-Type': 'application/json'},
body: jsonEncode({'path': path}),
);
if (response.statusCode == 200) {
return jsonDecode(response.body);
} else {
throw Exception('Rekisterin kysely epäonnistui: ${response.statusCode}');
}
}

Future<Map<String, dynamic>> sendNotification(String title, String message) async {
final response = await http.post(
Uri.parse('$baseUrl/api/win11/notify'),
headers: {'Content-Type': 'application/json'},
body: jsonEncode({'title': title, 'message': message}),
);
if (response.statusCode == 200) {
return jsonDecode(response.body);
} else {
throw Exception('Ilmoituksen lähetys epäonnistui: ${response.statusCode}');
}
}
}
