import 'package:flutter/widgets.dart';
import 'package:fluent_ui/fluent_ui.dart';

class Win96BackupModule extends StatefulWidget {
  const Win96BackupModule({super.key});

  @override
  State<Win96BackupModule> createState() => _Win96BackupModuleState();
}

class _Win96BackupModuleState extends State<Win96BackupModule> {
  String _backupStatus = 'Valmiina luomaan järjestelmävarmuuskopion (BKF).';
  bool _isBackingUp = false;
  double _progress = 0.0;

  void _startBackup() {
    setState(() {
      _isBackingUp = true;
      _progress = 35.0;
      _backupStatus = 'Pakataan rekisteriä ja kokoonpanoasetuksia...';
    });

    Future.delayed(const Duration(milliseconds: 600), () {
      if (mounted) {
        setState(() {
          _progress = 75.0;
          _backupStatus = 'Kirjoitetaan arkistoa virtuaalilevylle (A:\\ tai C:\\)...';
        });
      }
    });

    Future.delayed(const Duration(milliseconds: 1200), () {
      if (mounted) {
        setState(() {
          _progress = 100.0;
          _isBackingUp = false;
          _backupStatus = 'Varmuuskopiointi valmistui onnistuneesti! Tiedosto: win96_sys_bkf.dat';
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
              '💾 Win96 Backup & Recovery Agent (backup.exe)',
              style: TextStyle(fontWeight: FontWeight.bold, color: Colors.white, fontSize: 15),
            ),
            Text(
              _isBackingUp ? 'Varmuuskopioidaan...' : 'Valmis',
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
                  _backupStatus,
                  style: TextStyle(color: Colors.blue.withOpacity(0.9), fontSize: 12, fontFamily: 'monospace'),
                ),
                const SizedBox(height: 16),
                ProgressBar(value: _isBackingUp ? _progress : 100.0),
              ],
            ),
          ),
        ),
        const SizedBox(height: 12),
        Button(
          onPressed: _isBackingUp ? null : _startBackup,
          child: const Text('Aloita varmuuskopiointi'),
        ),
      ],
    );
  }
}
