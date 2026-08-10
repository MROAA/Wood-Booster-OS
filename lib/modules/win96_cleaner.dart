import 'package:flutter/widgets.dart';
import 'package:fluent_ui/fluent_ui.dart';

class Win96CleanerModule extends StatefulWidget {
  const Win96CleanerModule({super.key});

  @override
  State<Win96CleanerModule> createState() => _Win96CleanerModuleState();
}

class _Win96CleanerModuleState extends State<Win96CleanerModule> {
  String _cleanerStatus = 'Valmiina skannaamaan väliaikaistiedostoja.';
  bool _isCleaning = false;
  double _progress = 0.0;

  void _runCleaner() {
    setState(() {
      _isCleaning = true;
      _progress = 30.0;
      _cleanerStatus = 'Etsitään turhia .TMP ja .LOG tiedostoja...';
    });

    Future.delayed(const Duration(milliseconds: 600), () {
      if (mounted) {
        setState(() {
          _progress = 70.0;
          _cleanerStatus = 'Poistetaan vanhoja internet-välimuisteja...';
        });
      }
    });

    Future.delayed(const Duration(milliseconds: 1200), () {
      if (mounted) {
        setState(() {
          _progress = 100.0;
          _isCleaning = false;
          _cleanerStatus = 'Levynsiivous valmis! Vapautettu 14.8 MB levytilaa.';
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
              '🧹 Win96 Disk Cleanup Wizard (cleanmgr.exe)',
              style: TextStyle(fontWeight: FontWeight.bold, color: Colors.white, fontSize: 15),
            ),
            Text(
              _isCleaning ? 'Siivotaan...' : 'Valmis',
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
                  _cleanerStatus,
                  style: TextStyle(color: Colors.blue.withOpacity(0.9), fontSize: 12, fontFamily: 'monospace'),
                ),
                const SizedBox(height: 16),
                ProgressBar(value: _isCleaning ? _progress : 100.0),
              ],
            ),
          ),
        ),
        const SizedBox(height: 12),
        Button(
          onPressed: _isCleaning ? null : _runCleaner,
          child: const Text('Aloita levynsiivous'),
        ),
      ],
    );
  }
}
