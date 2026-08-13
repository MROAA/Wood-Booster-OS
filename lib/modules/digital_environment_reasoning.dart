import 'package:flutter/widgets.dart';
import 'package:fluent_ui/fluent_ui.dart';

class DigitalEnvironmentReasoningModule extends StatefulWidget {
  const DigitalEnvironmentReasoningModule({super.key});

  @override
  State<DigitalEnvironmentReasoningModule> createState() => _DigitalEnvironmentReasoningModuleState();
}

class _DigitalEnvironmentReasoningModuleState extends State<DigitalEnvironmentReasoningModule> {
  bool _reasoningActive = true;
  String _currentStep = 'Vaihe 3/3: Ajatusketjun validoini ja itsekorjaus valmis.';
  final List<String> _thoughtLog = [
    '[Chain-of-Thought] Analysoidaan digitaalisen tilan kuormitusta.',
    '[Self-Correction] Havaittiin pieni latenssipiikki; reititetään paketit uudelleen.',
    '[Validation] Järjestelmän tila palautettu optimaaliselle tasolle.',
  ];

  void _triggerReasoningCycle() {
    setState(() {
      _currentStep = 'Suoritetaan uutta päätettelysilmukkaa (CoT)...';
      _thoughtLog.insert(0, '[Chain-of-Thought] Manuaalinen päättelysykli käynnistetty.');
    });

    Future.delayed(const Duration(milliseconds: 700), () {
      if (mounted) {
        setState(() {
          _currentStep = 'Päättely ja itsekorjaus suoritettu onnistuneesti.';
          _thoughtLog.insert(0, '[Self-Correction] Optimoitu parametrit reaaliajassa.');
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
              '🧠 AI Autonomous Reasoning & Self-Correction',
              style: TextStyle(fontWeight: FontWeight.bold, color: Colors.white, fontSize: 15),
            ),
            Text(
              _reasoningActive ? 'AKTIIVINEN' : 'PYSÄYTETTY',
              style: TextStyle(color: _reasoningActive ? Colors.blue.withOpacity(0.9) : Colors.red, fontSize: 11, fontFamily: 'monospace'),
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
            _currentStep,
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
              itemCount: _thoughtLog.length,
              itemBuilder: (context, index) {
                return Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                  child: Text(
                    _thoughtLog[index],
                    style: TextStyle(color: Colors.white.withOpacity(0.8), fontSize: 11, fontFamily: 'monospace'),
                  ),
                );
              },
            ),
          ),
        ),
        const SizedBox(height: 12),
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: [
            Button(
              onPressed: _triggerReasoningCycle,
              child: const Text('Aja päätettelysykli (CoT)'),
            ),
            ToggleSwitch(
              checked: _reasoningActive,
              content: const Text('Autonominen itsekorjaus', style: TextStyle(color: Colors.white, fontSize: 12)),
              onChanged: (val) {
                setState(() {
                  _reasoningActive = val;
                });
              },
            ),
          ],
        ),
      ],
    );
  }
}
