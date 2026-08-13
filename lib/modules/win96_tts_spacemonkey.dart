import 'package:flutter/widgets.dart';
import 'package:fluent_ui/fluent_ui.dart';

class Win96TtsSpacemonkeyModule extends StatefulWidget {
  const Win96TtsSpacemonkeyModule({super.key});

  @override
  State<Win96TtsSpacemonkeyModule> createState() => _Win96TtsSpacemonkeyModuleState();
}

class _Win96TtsSpacemonkeyModuleState extends State<Win96TtsSpacemonkeyModule> {
  bool _isSpeaking = false;
  double _speechPitch = 1.2;
  double _speechRate = 0.9;
  String _ttsStatus = 'TTS Audio Engine valmiina syntetisoimaan Spacemonkeyn puhetta.';
  
  final List<String> _spokenHistory = [
    'Spacemonkey: "Äänisynteesi alustettu taajuudella 19.96 kHz."',
    'Spacemonkey: "Vektorivarasto ja headless-daemon toimivat moitteetta."',
  ];

  void _synthesizeAndSpeak() {
    setState(() {
      _isSpeaking = true;
      _ttsStatus = 'Syntetisoidaan äänivirtaa (Text-to-Speech)...';
    });

    Future.delayed(const Duration(milliseconds: 1000), () {
      if (mounted) {
        setState(() {
          _isSpeaking = false;
          _ttsStatus = 'Äänilähetys suoritettu onnistuneesti kaiuttimiin.';
          _spokenHistory.insert(0, 'Spacemonkey: "Kaikki järjestelmät synkronoitu puhekomennolla!"');
        });
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
              '🔊 Spacemonkey Voice Synthesis (TTS)',
              style: TextStyle(fontWeight: FontWeight.bold, color: Colors.white, fontSize: 15),
            ),
            Text(
              _isSpeaking ? 'PUHUU...' : 'VALMIINA',
              style: TextStyle(color: _isSpeaking ? Colors.green : Colors.blue.withOpacity(0.9), fontSize: 11, fontFamily: 'monospace'),
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
            _ttsStatus,
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
              itemCount: _spokenHistory.length,
              itemBuilder: (context, index) {
                return Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                  child: Text(
                    _spokenHistory[index],
                    style: TextStyle(color: Colors.white.withOpacity(0.85), fontSize: 11, fontFamily: 'monospace'),
                  ),
                );
              },
            ),
          ),
        ),
        const SizedBox(height: 12),
        Button(
          onPressed: _isSpeaking ? null : _synthesizeAndSpeak,
          child: const Text('Toista Spacemonkeyn puhe (TTS)'),
        ),
      ],
    );
  }
}
