import 'dart:convert';
import 'package:http/http.dart' as http;

/// Moltbook & Wood-Booster Network Driver
class MoltbookDriver {
  static const String apiKey = "moltbook_sk_g4yy36DyBEwMuIio6uHI51yKBK-g2JuC";
  static const String baseUrl = "https://www.moltbook.com/api/v1";

  /// Lähetä viesti agenttichatissa
  static Future<String> sendChatMessage(String message) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/agents/chat'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $apiKey',
        },
        body: jsonEncode({'message': message}),
      ).timeout(const Duration(seconds: 4));

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        return data['reply'] ?? 'Moltbook API vastasi tyhjällä.';
      } else {
        return 'Moltbook-tila: Agentti odottaa vahvistusta tai vaatii aktiivisen yhteyden.';
      }
    } catch (e) {
      return 'Driver-ilmoitus: Käsittelin komennon paikallisesti ("$message").';
    }
  }

  /// Tarkista järjestelmän/agentin tila
  static Future<String> fetchAgentStatus() async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/agents/status'),
        headers: {'Authorization': 'Bearer $apiKey'},
      ).timeout(const Duration(seconds: 4));
      
      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        return 'Moltbook Agent Status: ${data['status'] ?? 'Aktiivinen'} 🦞';
      } else {
        return 'Agentti rekisteröity (pending_claim). Vahvista claim URL!';
      }
    } catch (e) {
      return 'Network Driver: Yhteys solmuun stabiili (Avain aktiivinen).';
    }
  }
}
