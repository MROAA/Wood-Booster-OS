import 'package:flutter/widgets.dart';
import 'package:fluent_ui/fluent_ui.dart';

class Win96TaskManagerModule extends StatefulWidget {
  const Win96TaskManagerModule({super.key});

  @override
  State<Win96TaskManagerModule> createState() => _Win96TaskManagerModuleState();
}

class _Win96TaskManagerModuleState extends State<Win96TaskManagerModule> {
  final List<Map<String, String>> _processes = [
    {'name': 'EXPLORER.EXE', 'pid': '0412', 'status': 'Running', 'cpu': '2%'},
    {'name': 'WIN96_CORE.DLL', 'pid': '0100', 'status': 'System', 'cpu': '5%'},
    {'name': 'SPACEMONKEY.SYS', 'pid': '0888', 'status': 'Running', 'cpu': '12%'},
    {'name': 'PINBALL.EXE', 'pid': '1996', 'status': 'Suspended', 'cpu': '0%'},
  ];

  void _killProcess(int index) {
    setState(() {
      if (_processes.isNotEmpty && index < _processes.length) {
        _processes.removeAt(index);
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
              '📊 Win96 Task Manager (Ctrl+Alt+Del)',
              style: TextStyle(fontWeight: FontWeight.bold, color: Colors.white, fontSize: 15),
            ),
            Text(
              'Aktiivisia prosesseja: ${_processes.length}',
              style: TextStyle(color: Colors.blue.withOpacity(0.9), fontSize: 12),
            ),
          ],
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
              itemCount: _processes.length,
              itemBuilder: (context, index) {
                final proc = _processes[index];
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
                          Text(proc['name']!, style: const TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.bold, fontFamily: 'monospace')),
                          Text('PID: ${proc['pid']} | Tila: ${proc['status']}', style: TextStyle(color: Colors.white.withOpacity(0.6), fontSize: 10)),
                        ],
                      ),
                      Row(
                        children: [
                          Text('CPU: ${proc['cpu']}', style: TextStyle(color: Colors.blue.withOpacity(0.9), fontSize: 11)),
                          const SizedBox(width: 12),
                          Button(
                            onPressed: () => _killProcess(index),
                            child: const Text('Lopeta tehtävä'),
                          ),
                        ],
                      ),
                    ],
                  ),
                );
              },
            ),
          ),
        ),
      ],
    );
  }
}
