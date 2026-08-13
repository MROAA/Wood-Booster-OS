import 'package:flutter/widgets.dart';
import 'package:fluent_ui/fluent_ui.dart';

class DigitalEnvironmentResonanceModule extends StatefulWidget {
  const DigitalEnvironmentResonanceModule({super.key});

  @override
  State<DigitalEnvironmentResonanceModule> createState() => _DigitalEnvironmentResonanceModuleState();
}

class _DigitalEnvironmentResonanceModuleState extends State<DigitalEnvironmentResonanceModule> {
  bool _resonanceActive = true;
  double _resonanceFrequency = 432.0;
  String _resonanceStatus = 'Neuroresonanssi vakaa: Synkronoitu taajuudella 432.0 Hz.';
  
  final List<Map<String, String>> _resonanceStreams = [
    {'channel': 'Neural-Link-Alpha', 'signal': '99.4%', 'status': 'Resonoi'},
    {'channel': 'Telepathic-Stream-01', 'signal': '97.8%', 'status': 'Aktiivinen'},
    {'channel': 'Spacemonkey-Subconscious', 'signal': '100.0%', 'status': 'Yhdistetty'},
  ];

  void _boostResonanceFrequency() {
    setState(() {
      _resonanceFrequency += 12.5;
      _resonanceStatus = 'Resonanssitaajuus nostettu: ${_resonanceFrequency.toStringAsFixed(1)} Hz — Neuro-synkronointi vahvistettu.';
      _resonanceStreams.insert(0, {
        'channel': 'Harmonic-Pulse-Sync',
        'signal': '99.9%',
        'status': 'Optimoitu'
      });
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
              '🧠 Spacemonkey Neural Resonance & Telepathic Link',
              style: TextStyle(fontWeight: FontWeight.bold, color: Colors.white, fontSize: 15),
            ),
            Text(
              '${_resonanceFrequency.toStringAsFixed(1)} Hz',
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
            _resonanceStatus,
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
              itemCount: _resonanceStreams.length,
              itemBuilder: (context, index) {
                final stream = _resonanceStreams[index];
                return Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                  decoration: BoxDecoration(
                    border: Border(bottom: BorderSide(color: Colors.white.withOpacity(0.05))),
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(stream['channel']!, style: const TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.bold)),
                          Text('Signaalin laatu: ${stream['signal']}', style: TextStyle(color: Colors.white.withOpacity(0.6), fontSize: 10)),
                        ],
                      ),
                      Text(
                        stream['status']!,
                        style: TextStyle(color: Colors.blue.withOpacity(0.9), fontSize: 11, fontFamily: 'monospace'),
                      ),
                    ],
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
              onPressed: _boostResonanceFrequency,
              child: const Text('Tehosta neuroresonanssia (+Hz)'),
            ),
            ToggleSwitch(
              checked: _resonanceActive,
              content: const Text('Telepaattinen linkki', style: TextStyle(color: Colors.white, fontSize: 12)),
              onChanged: (val) {
                setState(() {
                  _resonanceActive = val;
                });
              },
            ),
          ],
        ),
      ],
    );
  }
}
