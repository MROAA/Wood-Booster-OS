import 'package:flutter/widgets.dart';
import 'package:fluent_ui/fluent_ui.dart';

class Win96MultimediaPlayerModule extends StatefulWidget {
  const Win96MultimediaPlayerModule({super.key});

  @override
  State<Win96MultimediaPlayerModule> createState() => _Win96MultimediaPlayerModuleState();
}

class _Win96MultimediaPlayerModuleState extends State<Win96MultimediaPlayerModule> {
  bool _isPlaying = false;
  double _playbackPosition = 0.35;
  String _currentMedia = 'spacemonkey_ambient_loop.flac';
  String _playerStatus = 'Valmis toistamaan multimediaa (Codec: Universal Win96 v1.0).';

  void _togglePlay() {
    setState(() {
      _isPlaying = !_isPlaying;
      _playerStatus = _isPlaying ? 'Toistetaan mediaa: $_currentMedia' : 'Toisto pysäytetty.';
    });
  }

  void _switchMedia(String mediaName) {
    setState(() {
      _currentMedia = mediaName;
      _isPlaying = true;
      _playerStatus = 'Vaihdettu mediaan: $mediaName (Toistetaan...)';
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
              '🎛️ Spacemonkey Multimedia Player Deck',
              style: TextStyle(fontWeight: FontWeight.bold, color: Colors.white, fontSize: 15),
            ),
            Text(
              _isPlaying ? 'TOISTETAAN' : 'PYSÄYTETTY',
              style: TextStyle(color: _isPlaying ? Colors.green : Colors.blue.withOpacity(0.9), fontSize: 11, fontFamily: 'monospace'),
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
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('Aktiivinen tiedosto: $_currentMedia', style: const TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.bold)),
              const SizedBox(height: 4),
              Text(_playerStatus, style: TextStyle(color: Colors.blue.withOpacity(0.9), fontSize: 11, fontFamily: 'monospace')),
            ],
          ),
        ),
        const SizedBox(height: 12),
        Expanded(
          child: Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: const Color(0xFF1E1E1E),
              borderRadius: BorderRadius.circular(6),
              border: Border.all(color: Colors.white.withOpacity(0.15)),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Text('Toiston eteneminen (Timeline)', style: TextStyle(color: Colors.white, fontSize: 12)),
                const SizedBox(height: 8),
                ProgressBar(value: _playbackPosition * 100),
                const SizedBox(height: 20),
                const Text('Mediakirjasto (Pudotetut tiedostot):', style: TextStyle(color: Colors.grey, fontSize: 11)),
                const SizedBox(height: 8),
                Row(
                  children: [
                    Button(
                      onPressed: () => _switchMedia('spacemonkey_ambient_loop.flac'),
                      child: const Text('Audio Loop'),
                    ),
                    const SizedBox(width: 8),
                    Button(
                      onPressed: () => _switchMedia('win96_core_architecture.mp4'),
                      child: const Text('Video Stream'),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
        const SizedBox(height: 12),
        Button(
          onPressed: _togglePlay,
          child: Text(_isPlaying ? 'Pysäytä (Pause)' : 'Toista (Play)'),
        ),
      ],
    );
  }
}
