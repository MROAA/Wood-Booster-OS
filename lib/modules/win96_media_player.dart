import 'package:flutter/widgets.dart';
import 'package:fluent_ui/fluent_ui.dart';

class Win96MediaPlayerModule extends StatefulWidget {
  const Win96MediaPlayerModule({super.key});

  @override
  State<Win96MediaPlayerModule> createState() => _Win96MediaPlayerModuleState();
}

class _Win96MediaPlayerModuleState extends State<Win96MediaPlayerModule> {
  bool _isPlaying = false;
  String _trackInfo = 'Track 01: Wood-Booster Anthem (MIDI)';
  double _playbackProgress = 0.0;

  void _togglePlay() {
    setState(() {
      _isPlaying = !_isPlaying;
      _playbackProgress = _isPlaying ? 35.0 : 0.0;
    });
  }

  void _nextTrack() {
    setState(() {
      _trackInfo = 'Track 02: Chicago 96 Startup Chimes';
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
              'media.exe',
              style: TextStyle(fontWeight: FontWeight.bold, color: Colors.white, fontSize: 15),
            ),
            Text(
              _isPlaying ? 'TOISTETAAN' : 'PYSÄYTETTY',
              style: TextStyle(color: _isPlaying ? Colors.green : Colors.blue.withOpacity(0.9), fontSize: 11, fontFamily: 'monospace'),
            ),
          ],
        ),
        const SizedBox(height: 12),
        Expanded(
          child: Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.black,
              borderRadius: BorderRadius.circular(6),
              border: Border.all(color: Colors.white.withOpacity(0.2)),
            ),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Icon(FluentIcons.music_note, size: 48, color: Colors.blue),
                const SizedBox(height: 16),
                Text(
                  _trackInfo,
                  style: TextStyle(color: Colors.blue.withOpacity(0.9), fontSize: 12, fontFamily: 'monospace', fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 20),
                ProgressBar(value: _isPlaying ? 65.0 : _playbackProgress),
                const SizedBox(height: 10),
                Text(
                  _isPlaying ? '01:24 / 03:45' : '00:00 / 03:45',
                  style: TextStyle(color: Colors.white.withOpacity(0.6), fontSize: 11, fontFamily: 'monospace'),
                ),
              ],
            ),
          ),
        ),
        const SizedBox(height: 12),
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: [
            Button(
              onPressed: _togglePlay,
              child: Text(_isPlaying ? 'Pysäytä (Pause)' : 'Toista (Play)'),
            ),
            Button(
              onPressed: _nextTrack,
              child: const Text('Seuraava raita'),
            ),
          ],
        ),
      ],
    );
  }
}
