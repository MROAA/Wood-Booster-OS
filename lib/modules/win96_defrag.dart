import 'package:flutter/widgets.dart';
import 'package:fluent_ui/fluent_ui.dart';

class Win96DefragModule extends StatefulWidget {
  const Win96DefragModule({super.key});

  @override
  State<Win96DefragModule> createState() => _Win96DefragModuleState();
}

class _Win96DefragModuleState extends State<Win96DefragModule> {
  String _defragStatus = 'Valmiina eheyttämään asemaa C:\\ (WOOD_OS).';
  bool _isDefragging = false;
  double _defragProgress = 0.0;

  void _startDefrag() {
    setState(() {
      _isDefragging = true;
      _defragProgress = 20.0;
      _defragStatus = 'Analysoidaan klustereita...';
    });

    Future.delayed(const Duration(milliseconds: 600), () {
      if (mounted) {
        setState(() {
          _defragProgress = 60.0;
          _defragStatus = 'Siirretään sirpaloituneita tiedostoja...';
        });
      }
    });

    Future.delayed(const Duration(milliseconds: 1200), () {
      if (mounted) {
        setState(() {
          _defragProgress = 100.0;
          _isDefragging = false;
          _defragStatus = 'Aseman C:\\ eheytys suoritettu loppuun! 0% sirpaloitunut.';
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
              '💽 Win96 Disk Defragmenter (defrag.exe)',
              style: TextStyle(fontWeight: FontWeight.bold, color: Colors.white, fontSize: 15),
            ),
            Text(
              _isDefragging ? 'Eheytetään...' : 'Valmis',
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
                  _defragStatus,
                  style: TextStyle(color: Colors.blue.withOpacity(0.9), fontSize: 12, fontFamily: 'monospace'),
                ),
                const SizedBox(height: 16),
                ProgressBar(value: _isDefragging ? _defragProgress : 100.0),
              ],
            ),
          ),
        ),
        const SizedBox(height: 12),
        Button(
          onPressed: _isDefragging ? null : _startDefrag,
          child: const Text('Aloita eheytys (Defrag)'),
        ),
      ],
    );
  }
}
