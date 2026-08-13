import 'package:flutter/widgets.dart';
import 'package:fluent_ui/fluent_ui.dart';

class DigitalEnvironmentLearningModule extends StatefulWidget {
  const DigitalEnvironmentLearningModule({super.key});

  @override
  State<DigitalEnvironmentLearningModule> createState() => _DigitalEnvironmentLearningModuleState();
}

class _DigitalEnvironmentLearningModuleState extends State<DigitalEnvironmentLearningModule> {
  double _neuralWeight = 0.942;
  int _iterationsCount = 1296;
  bool _isLearningActive = true;
  String _learningStatus = 'Koulutusprosessi käynnissä: LLM-tyylinen adaptiivinen painotus aktiivinen.';

  void _triggerLearningStep() {
    setState(() {
      _iterationsCount += 42;
      _neuralWeight += 0.005;
      if (_neuralWeight > 1.0) _neuralWeight = 0.999;
      _learningStatus = 'Suoritettu kontekstuaalinen oppimisaskel. Uudet painot päivitetty muistiin.';
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
              '🧠 AI Adaptive Neural Learning & LLM Engine',
              style: TextStyle(fontWeight: FontWeight.bold, color: Colors.white, fontSize: 15),
            ),
            Text(
              'Paino: ${_neuralWeight.toStringAsFixed(3)}',
              style: TextStyle(color: Colors.blue.withOpacity(0.9), fontSize: 11, fontFamily: 'monospace'),
            ),
          ],
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
                Text(
                  _learningStatus,
                  style: TextStyle(color: Colors.blue.withOpacity(0.9), fontSize: 12, fontFamily: 'monospace'),
                ),
                const SizedBox(height: 16),
                Text('Adaptaatio-iteraatiot: $_iterationsCount kpl', style: const TextStyle(color: Colors.white, fontSize: 12)),
                const SizedBox(height: 8),
                ProgressBar(value: (_neuralWeight * 100)),
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
              onPressed: _triggerLearningStep,
              child: const Text('Aja oppimissykli (Train Step)'),
            ),
            ToggleSwitch(
              checked: _isLearningActive,
              content: const Text('Jatkuva oppiminen', style: TextStyle(color: Colors.white, fontSize: 12)),
              onChanged: (val) {
                setState(() {
                  _isLearningActive = val;
                });
              },
            ),
          ],
        ),
      ],
    );
  }
}
