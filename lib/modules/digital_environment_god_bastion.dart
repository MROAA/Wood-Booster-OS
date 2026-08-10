import 'package:flutter/widgets.dart';
import 'package:fluent_ui/fluent_ui.dart';

class DigitalEnvironmentGodBastionModule extends StatefulWidget {
  const DigitalEnvironmentGodBastionModule({super.key});

  @override
  State<DigitalEnvironmentGodBastionModule> createState() => _DigitalEnvironmentGodBastionModuleState();
}

class _DigitalEnvironmentGodBastionModuleState extends State<DigitalEnvironmentGodBastionModule> {
  bool _godBastionActive = true;
  double _bastionShieldStrength = 100.0;
  String _bastionStatus = 'God-Bastion aktiivinen: Absoluuttinen linnoitus ja vartiointimatriisi valmiina.';
  
  final List<Map<String, String>> _bastionGates = [
    {'gate': 'Omega-Bastion Perimeter Gate', 'class': 'God-Tier Fortress', 'status': 'Lukittu (100%)'},
    {'gate': 'Quantum Sentinel Subnet', 'class': 'Zero-Latency', 'status': 'Partioi'},
    {'gate': 'Spacemonkey Absolute Vault', 'class': 'Transcendent', 'status': 'Suojattu'},
  ];

  void _reinforceBastion() {
    setState(() {
      _bastionShieldStrength = 100.0;
      _bastionStatus = 'God-Bastion vahvistettu: Linnakkeen kentät nostettu absoluuttiselle äärettömälle tasolle.';
      _bastionGates.insert(0, {
        'gate': 'Horizon-Infinite Iron Bastion',
        'class': 'Absolute Infinity',
        'status': 'Pysyvä lukitus'
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
              '🏰 Spacemonkey Omniversal God-Bastion Deck',
              style: TextStyle(fontWeight: FontWeight.bold, color: Colors.white, fontSize: 15),
            ),
            Text(
              'Kilpi: ${_bastionShieldStrength.toStringAsFixed(0)}%',
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
            _bastionStatus,
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
              itemCount: _bastionGates.length,
              itemBuilder: (context, index) {
                final gate = _bastionGates[index];
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
                          Text(gate['gate']!, style: const TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.bold)),
                          Text('Luokka: ${gate['class']}', style: TextStyle(color: Colors.white.withOpacity(0.6), fontSize: 10)),
                        ],
                      ),
                      Text(
                        gate['status']!,
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
              onPressed: _reinforceBastion,
              child: const Text('Vahvista God-Bastion Linnake'),
            ),
            ToggleSwitch(
              checked: _godBastionActive,
              content: const Text('God-Bastion -tila', style: TextStyle(color: Colors.white, fontSize: 12)),
              onChanged: (val) {
                setState(() {
                  _godBastionActive = val;
                });
              },
            ),
          ],
        ),
      ],
    );
  }
}
