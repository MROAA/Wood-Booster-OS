import 'package:flutter/widgets.dart';
import 'package:fluent_ui/fluent_ui.dart';

class DigitalEnvironmentAiModule extends StatefulWidget {
  const DigitalEnvironmentAiModule({super.key});

  @override
  State<DigitalEnvironmentAiModule> createState() => _DigitalEnvironmentAiModuleState();
}

class _DigitalEnvironmentAiModuleState extends State<DigitalEnvironmentAiModule> {
  bool _aiActive = true;
  String _aiStatus = 'Tekoäly tarkkailee digitaalista tilaa aktiivisesti.';
  final List<String> _actionsLog = [
    '[AI] Digitaalinen tila alustettu onnistuneesti.',
    '[AI] Resurssit optimoitu (Muisti vapautettu).',
    '[AI] Valvoo virtuaaliverkon solmupisteitä.',
  ];

  void _triggerAiAction() {
    setState(() {
      _aiStatus = 'Tekoäly suorittaa tilan optimointia ja skannausta...';
      _actionsLog.insert(0, '[AI] Manuaalinen tilan hallinta ja synkronointi suoritettu.');
    });

    Future.delayed(const Duration(milliseconds: 800), () {
      if (mounted) {
        setState(() {
          _aiStatus = 'Tekoäly hallitsee digitaalista tilaa optimaalisesti.';
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
              '🤖 AI Digital Space Autonomous Controller',
              style: TextStyle(fontWeight: FontWeight.bold, color: Colors.white, fontSize: 15),
            ),
            Text(
              _aiActive ? 'AUTONOMINEN' : 'PYSÄYTETTY',
              style: TextStyle(color: _aiActive ? Colors.blue.withOpacity(0.9) : Colors.red, fontSize: 11, fontFamily: 'monospace'),
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
            _aiStatus,
            style: TextStyle(color: Colors.blue.withOpacity(0.9), fontSize: 12, fontFamily: 'monospace'),
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
              itemCount: _actionsLog.length,
              itemBuilder: (context, index) {
                return Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                  child: Text(
                    _actionsLog[index],
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
              onPressed: _triggerAiAction,
              child: const Text('Suorita AI-optimointi'),
            ),
            ToggleSwitch(
              checked: _aiActive,
              content: const Text('Autonominen tila', style: TextStyle(color: Colors.white, fontSize: 12)),
              onChanged: (val) {
                setState(() {
                  _aiActive = val;
                });
              },
            ),
          ],
        ),
      ],
    );
  }
}
