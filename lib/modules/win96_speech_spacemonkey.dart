import 'package:flutter/widgets.dart';
import 'package:fluent_ui/fluent_ui.dart';

class Win96SpeechSpacemonkeyModule extends StatefulWidget {
  const Win96SpeechSpacemonkeyModule({super.key});

  @override
  State<Win96SpeechSpacemonkeyModule> createState() => _Win96SpeechSpacemonkeyModuleState();
}

class _Win96SpeechSpacemonkeyModuleState extends State<Win96SpeechSpacemonkeyModule> {
  bool _isListening = false;
  String _voiceStatus = 'Mikrofoni valmiina. Paina nappia ja puhu Spacemonkeylle.';
  final List<Map<String, String>> _transcriptLog = [
    {'speaker': 'System', 'text': 'Speech Recognition Engine v1.0 alustettu.'},
    {'speaker': 'Spacemonkey', 'text': 'Olen valmiina kuuntelemaan audiolähetettäsi, kapteeni.'},
  ];

  void _toggleListening() {
    setState(() {
      _isListening = !_isListening;
      if (_isListening) {
        _voiceStatus = 'Kuunnellaan äänivirtaa... Puhu mikrofoniin.';
        _transcriptLog.insert(0, {'speaker': 'System', 'text': '[Audio Stream] Mikrofoni avattu (Aktiivinen tallennus).'});
      } else {
        _voiceStatus = 'Puhe muutettu tekstiksi ja lähetetty Spacemonkeylle.';
        _transcriptLog.insert(0, {'speaker': 'Sinä (Ääni)', 'text': '"Spacemonkey, tarkista järjestelmän vektorimuisti ja RAG-status."'});
        _transcriptLog.insert(0, {'speaker': 'Spacemonkey', 'text': 'Vastaanotettu! Vektorivarasto on synkronoitu ja toimii optimaalisesti.'});
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            const Text(
              '🎙️ Spacemonkey Voice Interface & Speech-to-Text',
              style: TextStyle(fontWeight: FontWeight.bold, color: Colors.white, fontSize: 15),
            ),
            Text(
              _isListening ? 'KUUNNELLAAN...' : 'VALMIINA',
              style: TextStyle(color: _isListening ? Colors.green : Colors.blue.withOpacity(0.9), fontSize: 11, fontFamily: 'monospace'),
            ),
          ],
        ),
        const SizedBox(height: 12),
        Container(
          width: double.infinity,
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: Colors.black,
            borderRadius: BorderRadius.circular(6),
            border: Border.all(color: Colors.white.withOpacity(0.2)),
          ),
          child: Text(
            _voiceStatus,
            style: TextStyle(color: Colors.blue.withOpacity(0.9), fontSize: 11, fontFamily: 'monospace'),
          ),
        ),
        const SizedBox(height: 12),
        Expanded(
          child: Container(
            decoration: BoxDecoration(
              color: const Color(0xFF1E1E1E),
              borderRadius: BorderRadius.circular(6),
              border: Border.all(color: Colors.white.withOpacity(0.15)),
            ),
            child: ListView.builder(
              itemCount: _transcriptLog.length,
              itemBuilder: (context, index) {
                final entry = _transcriptLog[index];
                return Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                  child: Text(
                    '[${entry['speaker']}]: ${entry['text']}',
                    style: TextStyle(color: Colors.white.withOpacity(0.85), fontSize: 11, fontFamily: 'monospace'),
                  ),
                );
              },
            ),
          ),
        ),
        const SizedBox(height: 12),
        Button(
          onPressed: _toggleListening,
          child: Text(_isListening ? 'Lopeta kuuntelu & Lähetä' : 'Puhu Spacemonkeylle (Mikrofoni ON)'),
        ),
      ],
    );
  }
}
