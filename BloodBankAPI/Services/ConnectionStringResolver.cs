namespace BloodBankAPI.Services;

public static class ConnectionStringResolver
{
    public static string Resolve(IConfiguration config)
    {
        var resolved = TryResolve(config, out var source)
            ?? throw new InvalidOperationException(BuildHelpMessage(config));

        return resolved;
    }

    public static object GetDiagnostics(IConfiguration config)
    {
        var defaultConnection = config.GetConnectionString("DefaultConnection");
        var resolved = TryResolve(config, out var source);

        return new
        {
            resolvedSource = source ?? "none",
            canResolve = resolved != null,
            vars = new
            {
                hasConnectionString = !string.IsNullOrWhiteSpace(defaultConnection),
                connectionStringLooksLocal = LooksLocal(defaultConnection),
                connectionStringHasPlaceholder = defaultConnection?.Contains("${{") == true,
                hasMysqlUrl = IsSet(config["MYSQL_URL"]),
                hasMysqlPublicUrl = IsSet(config["MYSQL_PUBLIC_URL"]),
                hasDatabaseUrl = IsSet(config["DATABASE_URL"]),
                hasMysqlHost = IsSet(config["MYSQLHOST"]) || IsSet(config["MYSQL_HOST"]),
                hasMysqlPort = IsSet(config["MYSQLPORT"]) || IsSet(config["MYSQL_PORT"]),
                hasMysqlDatabase = IsSet(config["MYSQLDATABASE"]) || IsSet(config["MYSQL_DATABASE"]),
                hasMysqlUser = IsSet(config["MYSQLUSER"]) || IsSet(config["MYSQL_USER"]),
                hasMysqlPassword = IsSet(config["MYSQLPASSWORD"]) || IsSet(config["MYSQL_PASSWORD"]),
                hasJwtKey = IsSet(config["Jwt:Key"])
            },
            hint = BuildHint(config, source)
        };
    }

    private static string? TryResolve(IConfiguration config, out string? source)
    {
        source = null;
        var fromConfig = config.GetConnectionString("DefaultConnection");

        // Ignore localhost connection strings on Railway — common misconfiguration.
        if (IsUsableConnectionString(fromConfig) && !LooksLocal(fromConfig))
        {
            source = "ConnectionStrings__DefaultConnection";
            return ApplySslMode(fromConfig!, ExtractHost(fromConfig!));
        }

        foreach (var (name, url) in UrlCandidates(config))
        {
            var parsed = ParseMySqlUrl(url);
            if (!string.IsNullOrWhiteSpace(parsed))
            {
                source = name;
                return parsed;
            }
        }

        var fromParts = BuildFromMySqlVariables(config);
        if (!string.IsNullOrWhiteSpace(fromParts))
        {
            source = "MYSQLHOST/MYSQLPORT/...";
            return fromParts;
        }

        return null;
    }

    private static IEnumerable<(string Name, string? Url)> UrlCandidates(IConfiguration config)
    {
        yield return ("MYSQL_URL", config["MYSQL_URL"]);
        yield return ("MYSQL_PUBLIC_URL", config["MYSQL_PUBLIC_URL"]);
        yield return ("DATABASE_URL", config["DATABASE_URL"]);
    }

    private static bool IsUsableConnectionString(string? value) =>
        !string.IsNullOrWhiteSpace(value) && !value.Contains("${{");

    private static bool LooksLocal(string? value) =>
        !string.IsNullOrWhiteSpace(value) &&
        (value.Contains("localhost", StringComparison.OrdinalIgnoreCase) ||
         value.Contains("127.0.0.1", StringComparison.OrdinalIgnoreCase));

    private static bool IsSet(string? value) => !string.IsNullOrWhiteSpace(value);

    private static string? ParseMySqlUrl(string? url)
    {
        if (string.IsNullOrWhiteSpace(url) || !url.StartsWith("mysql://", StringComparison.OrdinalIgnoreCase))
        {
            return null;
        }

        if (!Uri.TryCreate(url, UriKind.Absolute, out var uri))
        {
            return null;
        }

        var userInfo = uri.UserInfo.Split(':', 2);
        var user = Uri.UnescapeDataString(userInfo[0]);
        var password = userInfo.Length > 1 ? Uri.UnescapeDataString(userInfo[1]) : "";
        var database = uri.AbsolutePath.TrimStart('/');
        var port = uri.Port > 0 ? uri.Port : 3306;

        if (string.IsNullOrWhiteSpace(uri.Host) || string.IsNullOrWhiteSpace(database) || string.IsNullOrWhiteSpace(user))
        {
            return null;
        }

        return ApplySslMode(
            $"Server={uri.Host};Port={port};Database={database};User={user};Password={password};",
            uri.Host);
    }

    private static string? BuildFromMySqlVariables(IConfiguration config)
    {
        var host = FirstNonEmpty(config["MYSQLHOST"], config["MYSQL_HOST"]);
        var port = FirstNonEmpty(config["MYSQLPORT"], config["MYSQL_PORT"]) ?? "3306";
        var database = FirstNonEmpty(config["MYSQLDATABASE"], config["MYSQL_DATABASE"]);
        var user = FirstNonEmpty(config["MYSQLUSER"], config["MYSQL_USER"]);
        var password = FirstNonEmpty(config["MYSQLPASSWORD"], config["MYSQL_PASSWORD"]) ?? "";

        if (string.IsNullOrWhiteSpace(host) || string.IsNullOrWhiteSpace(database) || string.IsNullOrWhiteSpace(user))
        {
            return null;
        }

        return ApplySslMode(
            $"Server={host};Port={port};Database={database};User={user};Password={password};",
            host);
    }

    private static string ApplySslMode(string connectionString, string host)
    {
        if (connectionString.Contains("SslMode", StringComparison.OrdinalIgnoreCase))
        {
            return connectionString.TrimEnd(';') + ";";
        }

        // Railway private network hostnames often fail with SslMode=Required.
        var sslMode = host.Contains("railway.internal", StringComparison.OrdinalIgnoreCase)
            ? "Preferred"
            : "Required";

        return connectionString.TrimEnd(';') + $";SslMode={sslMode};";
    }

    private static string ExtractHost(string connectionString)
    {
        foreach (var part in connectionString.Split(';', StringSplitOptions.RemoveEmptyEntries))
        {
            if (part.StartsWith("Server=", StringComparison.OrdinalIgnoreCase))
            {
                return part["Server=".Length..];
            }
        }

        return "";
    }

    private static string BuildHelpMessage(IConfiguration config)
    {
        var defaultConnection = config.GetConnectionString("DefaultConnection");

        if (LooksLocal(defaultConnection))
        {
            return "ConnectionStrings__DefaultConnection points to localhost. Delete it on Hemo-Grid and add MYSQL_URL as a Reference from your MySQL service.";
        }

        if (!string.IsNullOrWhiteSpace(defaultConnection) && defaultConnection.Contains("${{"))
        {
            return "ConnectionStrings__DefaultConnection has unresolved ${{...}} placeholders. Delete it and add MYSQL_URL as a Reference from MySQL.";
        }

        return "No MySQL connection found on Hemo-Grid. Add MYSQL_URL via Variables → Add Reference → your MySQL service.";
    }

    private static string BuildHint(IConfiguration config, string? source)
    {
        var defaultConnection = config.GetConnectionString("DefaultConnection");

        if (LooksLocal(defaultConnection))
        {
            return "DELETE ConnectionStrings__DefaultConnection on Hemo-Grid — it contains localhost.";
        }

        if (source == null && !IsSet(config["MYSQL_URL"]))
        {
            return "Add MYSQL_URL on Hemo-Grid using Add Reference from your MySQL service.";
        }

        if (source != null)
        {
            return $"Connection resolved from {source}. If DB still fails, redeploy Hemo-Grid after saving variables.";
        }

        return "Check Hemo-Grid variables and redeploy.";
    }

    private static string? FirstNonEmpty(params string?[] values)
    {
        foreach (var value in values)
        {
            if (!string.IsNullOrWhiteSpace(value))
            {
                return value;
            }
        }

        return null;
    }
}
