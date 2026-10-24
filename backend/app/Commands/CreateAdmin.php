<?php
namespace App\Commands;
use CodeIgniter\CLI\BaseCommand;
use CodeIgniter\CLI\CLI;
class CreateAdmin extends BaseCommand
{
    protected $group = "Stable";
    protected $name = "stable:admin";
    protected $description = "Create an initial super administrator interactively.";
    public function run(array $params)
    {
        $email = CLI::prompt("Email");
        if (!posix_isatty(STDIN)) {
            CLI::error(
                "Use an interactive terminal for secure password entry.",
            );
            return;
        }
        CLI::write("Password (14+ characters):");
        system("stty -echo");
        try {
            $password = rtrim(fgets(STDIN), "\r\n");
        } finally {
            system("stty echo");
            CLI::newLine();
        }
        if (
            !filter_var($email, FILTER_VALIDATE_EMAIL) ||
            strlen($password) < 14
        ) {
            CLI::error(
                "Valid email and password of at least 14 characters required.",
            );
            return;
        }
        db_connect()
            ->table("users")
            ->insert([
                "email" => strtolower($email),
                "password" => password_hash($password, PASSWORD_ARGON2ID),
                "role" => "super_admin",
                "active" => 1,
            ]);
        CLI::write("Administrator created.");
    }
}
