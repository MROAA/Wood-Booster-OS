import 'package:flutter/widgets.dart';
import 'package:fluent_ui/fluent_ui.dart';

class Win96PinballModule extends StatefulWidget {
  const Win96PinballModule({super.key});

  @override
  State<Win96PinballModule> createState() => _Win96PinballModuleState();
}

class _Win96PinballModuleState extends State<Win96PinballModule> {
  int _score = 0;
  int _ballsLeft = 3;
  String _gameStatus = 'Paina "Laukaise kuula" aloittaaksesi pelin!';
  bool _isPlaying = false;

  void _launchBall() {
    setState(() {
      _isPlaying = true;
      _score += 12500;
      _gameStatus = 'Kuula liikukkeessa rampeilla! Pisteitä kertynyt.';
    });
  }

  void _resetGame() {
    setState(() {
      _score = 0;
      _ballsLeft = 3;
      _isPlaying = false;
      _gameStatus = 'Peli alustettu. Valmiina uuteen vuoroon.';
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
              '🕹️ Win96 3D Pinball: Space Cadet',
              style: TextStyle(fontWeight: FontWeight.bold, color: Colors.white, fontSize: 15),
            ),
            Text(
              'Pisteet: $_score | Pallot: $_ballsLeft',
              style: TextStyle(color: Colors.blue.withOpacity(0.9), fontSize: 11, fontFamily: 'monospace'),
            ),
          ],
        ),
        const SizedBox(height: 12),
        Expanded(
          child: Container(
            width: double.infinity,
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.black,
              borderRadius: BorderRadius.circular(6),
              border: Border.all(color: Colors.white.withOpacity(0.2)),
            ),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Icon(FluentIcons.game, size: 48, color: Colors.blue),
                const SizedBox(height: 16),
                Text(
                  _gameStatus,
                  style: TextStyle(color: Colors.blue.withOpacity(0.9), fontSize: 12, fontFamily: 'monospace', fontWeight: FontWeight.bold),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 12),
                Text(
                  'Huippupisteet (High Score): 142,500 pts',
                  style: TextStyle(color: Colors.white.withOpacity(0.6), fontSize: 11),
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
              onPressed: _launchBall,
              child: const Text('Laukaise kuula (Space)'),
            ),
            Button(
              onPressed: _resetGame,
              child: const Text('Uusi peli (F2)'),
            ),
          ],
        ),
      ],
    );
  }
}
