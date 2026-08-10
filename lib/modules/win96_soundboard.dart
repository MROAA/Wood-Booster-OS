import 'package:flutter/widgets.dart';
import 'package:fluent_ui/fluent_ui.dart';

class Win96SoundboardModule extends StatefulWidget {
  const Win96SoundboardModule({super.key});

  @override
  State<Win96SoundboardModule> createState() => _Win96SoundboardModuleState();
}

class _Win96SoundboardModuleState extends State<Win96SoundboardModule> {
  String _activeSound = 'Ei äänitettyä virtaa.';

  void _playSound(String name) {
    setState(() {
      _activeSound = '🎶 Soitetaan: $name.wav (SoundBlaster 16)';
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
              '🔊 Win96 Multimedia Soundboard',
              style: TextStyle(fontWeight: FontWeight.bold, color: Colors.white, fontSize: 15),
            ),
            Text(
              'MIDI Port: 330h',
              style: TextStyle(color: Colors.blue.withOpacity(0.9), fontSize: 11, fontFamily: 'monospace'),
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
            _activeSound,
            style: TextStyle(color: Colors.blue.withOpacity(0.9), fontSize: 12, fontFamily: 'monospace'),
          ),
        ),
        const SizedBox(height: 16),
        Expanded(
          child: GridView.count(
            crossAxisCount: 2,
            crossAxisSpacing: 8,
            mainAxisSpacing: 8,
            childAspectRatio: 3.5,
            children: [
              Button(onPressed: () => _playSound('Win96_Startup'), child: const Text('Startup Chimes')),
              Button(onPressed: () => _playSound('Modem_Dialup'), child: const Text('Modem Dial (56k)')),
              Button(onPressed: () => _playSound('Critical_Stop'), child: const Text('Critical Stop')),
              Button(onPressed: () => _playSound('Empty_Recycle'), child: const Text('Recycle Trash')),
              Button(onPressed: () => _playSound('Pinball_Bumper'), child: const Text('Pinball Bumper')),
              Button(onPressed: () => _playSound('Wood_Booster_Theme'), child: const Text('Wood Theme MIDI')),
            ],
          ),
        ),
      ],
    );
  }
}
