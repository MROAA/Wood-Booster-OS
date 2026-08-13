import 'package:flutter/widgets.dart';
import 'package:fluent_ui/fluent_ui.dart';

class Win96DesktopWidgets extends StatefulWidget {
  const Win96DesktopWidgets({super.key});

  @override
  State<Win96DesktopWidgets> createState() => _Win96DesktopWidgetsState();
}

class _Win96DesktopWidgetsState extends State<Win96DesktopWidgets> {
  bool _audioPlaying = false;
  String _mediaStatus = 'Media Player pysäytetty.';

  void _toggleMediaPlayer() {
    setState(() {
      _audioPlaying = !_audioPlaying;
      _mediaStatus = _audioPlaying ? '🎶 Toistaa: Win96_Chimes_MIDI.wav (Loop)' : 'Media Player pysäytetty.';
    });
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          '🖥️ Win96 System Properties & Media Driver',
          style: TextStyle(fontWeight: FontWeight.bold, color: Colors.white, fontSize: 15),
        ),
        const SizedBox(height: 12),
        Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: const Color(0xFF1E1E1E),
            borderRadius: BorderRadius.circular(6),
            border: Border.all(color: Colors.white.withOpacity(0.15)),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text('Järjestelmä:', style: TextStyle(color: Colors.white70, fontSize: 12, fontWeight: FontWeight.bold)),
              const SizedBox(height: 4),
              Text('Wood-Booster OS / Windows 96 Chicago Kernel', style: TextStyle(color: Colors.blue.withOpacity(0.9), fontSize: 12)),
              const SizedBox(height: 8),
              const Text('Suoritin (CPU):', style: TextStyle(color: Colors.white70, fontSize: 12, fontWeight: FontWeight.bold)),
              const SizedBox(height: 4),
              Text('Pentium Pro @ 200MHz (Virtual Core)', style: TextStyle(color: Colors.blue.withOpacity(0.9), fontSize: 12)),
              const SizedBox(height: 8),
              const Text('Keskusmuisti (RAM):', style: TextStyle(color: Colors.white70, fontSize: 12, fontWeight: FontWeight.bold)),
              const SizedBox(height: 4),
              Text('64 MB EDO RAM (32.4 MB vapaana)', style: TextStyle(color: Colors.blue.withOpacity(0.9), fontSize: 12)),
            ],
          ),
        ),
        const SizedBox(height: 16),
        const Text(
          '🎵 Win96 Retro Media Player',
          style: TextStyle(fontWeight: FontWeight.bold, color: Colors.white, fontSize: 14),
        ),
        const SizedBox(height: 8),
        Container(
          padding: const EdgeInsets.all(10),
          decoration: BoxDecoration(
            color: Colors.black,
            borderRadius: BorderRadius.circular(4),
            border: Border.all(color: Colors.white.withOpacity(0.2)),
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Expanded(
                child: Text(
                  _mediaStatus,
                  style: TextStyle(color: Colors.blue.withOpacity(0.9), fontSize: 12, fontFamily: 'monospace'),
                ),
              ),
              Button(
                onPressed: _toggleMediaPlayer,
                child: Text(_audioPlaying ? 'Pysäytä' : 'Toista'),
              ),
            ],
          ),
        ),
      ],
    );
  }
}
