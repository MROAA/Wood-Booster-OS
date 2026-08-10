import 'package:flutter/widgets.dart';
import 'package:fluent_ui/fluent_ui.dart';

class DigitalEnvironmentWorkflowModule extends StatefulWidget {
  const DigitalEnvironmentWorkflowModule({super.key});

  @override
  State<DigitalEnvironmentWorkflowModule> createState() => _DigitalEnvironmentWorkflowModuleState();
}

class _DigitalEnvironmentWorkflowModuleState extends State<DigitalEnvironmentWorkflowModule> {
  bool _autoPredict = true;
  String _workflowStatus = 'Valmiina ennakoimaan seuraavaa komentoa (Context-aware).';
  final List<Map<String, String>> _macros = [
    {'name': 'Macro_AutoCleanup', 'trigger': 'Levytilan vähäisyys', 'status': 'Aktiivinen'},
    {'name': 'Macro_NetworkPulse', 'trigger': 'Yhteyskatkos', 'status': 'Valmiudessa'},
    {'name': 'Macro_MemoryCompact', 'trigger': 'RAM > 80%', 'status': 'Aktiivinen'},
  ];

  void _executeWorkflow() {
    setState(() {
      _workflowStatus = 'Ennakoiva työnkulku suoritettu: Kaikki makrot optimoitu taustalla.';
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
              '⚡ AI Predictive Task Automation & Workflow',
              style: TextStyle(fontWeight: FontWeight.bold, color: Colors.white, fontSize: 15),
            ),
            Text(
              _autoPredict ? 'ENNAKOIVA' : 'MANUAALINEN',
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
            _workflowStatus,
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
              itemCount: _macros.length,
              itemBuilder: (context, index) {
                final macro = _macros[index];
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
                          Text(macro['name']!, style: const TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.bold)),
                          Text('Laukaisin: ${macro['trigger']}', style: TextStyle(color: Colors.white.withOpacity(0.6), fontSize: 10)),
                        ],
                      ),
                      Text(
                        macro['status']!,
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
              onPressed: _executeWorkflow,
              child: const Text('Suorita ennakoiva makro'),
            ),
            ToggleSwitch(
              checked: _autoPredict,
              content: const Text('Automaattinen ennakointi', style: TextStyle(color: Colors.white, fontSize: 12)),
              onChanged: (val) {
                setState(() {
                  _autoPredict = val;
                });
              },
            ),
          ],
        ),
      ],
    );
  }
}
