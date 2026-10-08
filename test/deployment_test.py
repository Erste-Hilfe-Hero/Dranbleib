import importlib.util
import io
import tarfile
import unittest
from pathlib import Path

spec = importlib.util.spec_from_file_location('installer', Path(__file__).resolve().parents[1] / 'deployment/install-private.py')
installer = importlib.util.module_from_spec(spec)
spec.loader.exec_module(installer)


class ArchiveSafety(unittest.TestCase):
    def check(self, name, kind=tarfile.REGTYPE):
        content = io.BytesIO()
        with tarfile.open(fileobj=content, mode='w') as archive:
            member = tarfile.TarInfo(name)
            member.type = kind
            if kind == tarfile.SYMTYPE:
                member.linkname = '/etc/passwd'
            archive.addfile(member)
        content.seek(0)
        with tarfile.open(fileobj=content) as archive:
            installer.assert_archive_safe(archive)

    def test_valid_release_file(self):
        self.check('src/server.js')

    def test_parent_traversal(self):
        with self.assertRaises(RuntimeError):
            self.check('src/../../etc/hosts')

    def test_absolute_path(self):
        with self.assertRaises(RuntimeError):
            self.check('/etc/hosts')

    def test_symlink(self):
        with self.assertRaises(RuntimeError):
            self.check('src/link', tarfile.SYMTYPE)

    def test_no_environment_files(self):
        with self.assertRaises(RuntimeError):
            self.check('.env')

    def test_no_device_file(self):
        with self.assertRaises(RuntimeError):
            self.check('runtime/device', tarfile.CHRTYPE)


if __name__ == '__main__':
    unittest.main()
