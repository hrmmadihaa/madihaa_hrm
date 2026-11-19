import pyodbc
import json

DATABASE_PATH = r"E:\ANVIZ Crosschex Backup\DB\CrossChex.mdb"

connection_string = (
    "DRIVER={Microsoft Access Driver (*.mdb, *.accdb)};"
    f"DBQ={DATABASE_PATH};"
)

try:
    conn = pyodbc.connect(connection_string, readonly=True)
    cursor = conn.cursor()

    output = []
    output.append("=== DATABASE TABLES ===")
    
    # Check all table types
    for table_type in ['TABLE', 'VIEW', 'SYSTEM TABLE']:
        output.append(f"\n--- {table_type} ---")
        for table in cursor.tables(tableType=table_type):
            table_name = table.table_name
            output.append(f"\n{table_type}: {table_name}")
            output.append("-" * 50)
            columns = cursor.columns(table=table_name)
            for column in columns:
                output.append(
                    f"Column: {column.column_name} | "
                    f"Type: {column.type_name}"
                )

    # Try to get sample data from common table names
    output.append("\n=== SAMPLE DATA FROM COMMON TABLES ===")
    common_tables = ['Checkinout', 'Userinfo', 'Departments', 'Devices', 'Attendance', 'Transactions']
    
    for table_name in common_tables:
        try:
            cursor.execute(f"SELECT TOP 5 * FROM [{table_name}]")
            rows = cursor.fetchall()
            if rows:
                output.append(f"\nTABLE: {table_name} (SAMPLE DATA)")
                output.append("-" * 50)
                columns = [column[0] for column in cursor.description]
                output.append(f"Columns: {', '.join(columns)}")
                for row in rows:
                    output.append(f"Row: {row}")
        except Exception as e:
            pass  # Table doesn't exist or can't be accessed

    conn.close()
    output.append("\n=== INSPECTION COMPLETE ===")
    
    # Print to console
    print("\n".join(output))
    
    # Save to file
    with open("database_structure.txt", "w") as f:
        f.write("\n".join(output))
    print("\nFull output saved to database_structure.txt")

except Exception as e:
    print(f"Error: {e}")
    print("\nTroubleshooting:")
    print("1. Ensure Microsoft Access Database Engine is installed")
    print("2. Ensure the Python architecture (32/64-bit) matches the ODBC driver")
    print("3. Verify the database path is correct")
    print("4. Make sure the database is not open in CrossChex Standard")
