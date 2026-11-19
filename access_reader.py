import pyodbc
from datetime import datetime, timedelta
from typing import List, Dict, Optional
import json

class CrossChexReader:
    def __init__(self, database_path: str):
        self.database_path = database_path
        self.connection_string = (
            "DRIVER={Microsoft Access Driver (*.mdb, *.accdb)};"
            f"DBQ={database_path};"
        )
        self.conn = None

    def connect(self):
        """Establish connection to the Access database"""
        try:
            self.conn = pyodbc.connect(self.connection_string, readonly=True)
            print(f"Connected to database: {self.database_path}")
            return True
        except Exception as e:
            print(f"Failed to connect to database: {e}")
            return False

    def close(self):
        """Close the database connection"""
        if self.conn:
            self.conn.close()
            print("Database connection closed")

    def get_users(self) -> List[Dict]:
        """
        Get all users from Userinfo table
        Returns list of user dictionaries
        """
        if not self.conn:
            raise Exception("Database not connected")

        cursor = self.conn.cursor()
        query = """
            SELECT userid, UserCode, Name, Deptid, EmployDate, Telephone, Mobile
            FROM Userinfo
            WHERE UserCode IS NOT NULL AND UserCode <> '0'
        """
        
        cursor.execute(query)
        users = []
        
        for row in cursor.fetchall():
            users.append({
                'userid': str(row.userid),
                'userCode': str(row.UserCode) if row.UserCode else None,
                'name': row.Name,
                'deptid': row.Deptid,
                'employDate': str(row.EmployDate) if row.EmployDate else None,
                'telephone': row.Telephone,
                'mobile': row.Mobile
            })
        
        return users

    def get_attendance_records(
        self, 
        start_date: Optional[datetime] = None, 
        end_date: Optional[datetime] = None,
        limit: int = 1000
    ) -> List[Dict]:
        """
        Get attendance records from Checkinout table
        Can filter by date range
        
        Args:
            start_date: Start date for filtering (inclusive)
            end_date: End date for filtering (inclusive)
            limit: Maximum number of records to return
        
        Returns:
            List of attendance record dictionaries
        """
        if not self.conn:
            raise Exception("Database not connected")

        cursor = self.conn.cursor()
        
        # Build query with optional date filter
        if start_date and end_date:
            query = """
                SELECT Logid, userid, CheckTime, CheckType, Sensorid, 
                       WorkType, AttFlag, [Checked], temperature
                FROM Checkinout
                WHERE CheckTime >= ? AND CheckTime <= ?
                ORDER BY CheckTime ASC
            """
            cursor.execute(query, (start_date, end_date))
        else:
            query = """
                SELECT Logid, userid, CheckTime, CheckType, Sensorid, 
                       WorkType, AttFlag, [Checked], temperature
                FROM Checkinout
                ORDER BY CheckTime DESC
            """
            cursor.execute(query)
        
        records = []
        
        for row in cursor.fetchall():
            records.append({
                'logid': row.Logid,
                'userid': str(row.userid),
                'checkTime': row.CheckTime.isoformat() if row.CheckTime else None,
                'checkType': row.CheckType,  # 0=check-in, 1=check-out typically
                'sensorid': row.Sensorid,
                'workType': row.WorkType,
                'attFlag': row.AttFlag,
                'checked': row.Checked,
                'temperature': float(row.temperature) if row.temperature else None
            })
        
        # Apply limit if specified
        if limit and len(records) > limit:
            records = records[:limit]
        
        return records

    def get_attendance_since_last_sync(
        self, 
        last_sync_time: datetime,
        device_id: Optional[str] = None
    ) -> List[Dict]:
        """
        Get attendance records since the last synchronization time
        
        Args:
            last_sync_time: Last successful sync timestamp
            device_id: Optional device filter (Sensorid)
        
        Returns:
            List of new attendance records
        """
        if not self.conn:
            raise Exception("Database not connected")

        cursor = self.conn.cursor()
        
        if device_id:
            query = """
                SELECT Logid, userid, CheckTime, CheckType, Sensorid, 
                       WorkType, AttFlag, [Checked], temperature
                FROM Checkinout
                WHERE CheckTime > ? AND Sensorid = ?
                ORDER BY CheckTime ASC
            """
            cursor.execute(query, (last_sync_time, device_id))
        else:
            query = """
                SELECT Logid, userid, CheckTime, CheckType, Sensorid, 
                       WorkType, AttFlag, [Checked], temperature
                FROM Checkinout
                WHERE CheckTime > ?
                ORDER BY CheckTime ASC
            """
            cursor.execute(query, (last_sync_time,))
        
        records = []
        
        for row in cursor.fetchall():
            records.append({
                'logid': row.Logid,
                'userid': str(row.userid),
                'checkTime': row.CheckTime.isoformat() if row.CheckTime else None,
                'checkType': row.CheckType,
                'sensorid': row.Sensorid,
                'workType': row.WorkType,
                'attFlag': row.AttFlag,
                'checked': row.Checked,
                'temperature': float(row.temperature) if row.temperature else None
            })
        
        return records

    def get_device_info(self) -> List[Dict]:
        """
        Get device information from the database
        Note: CrossChex may store device info in different tables
        This is a placeholder - actual table structure may vary
        """
        if not self.conn:
            raise Exception("Database not connected")

        cursor = self.conn.cursor()
        
        # Try to find device-related tables
        devices = []
        
        # Check if there's a Devices table
        try:
            cursor.execute("SELECT * FROM Devices")
            for row in cursor.fetchall():
                devices.append({
                    'sensorid': row[0],
                    'name': row[1] if len(row) > 1 else None
                })
        except:
            pass
        
        # If no Devices table, get unique Sensorid from Checkinout
        if not devices:
            cursor.execute("SELECT DISTINCT Sensorid FROM Checkinout")
            for row in cursor.fetchall():
                devices.append({
                    'sensorid': row.Sensorid,
                    'name': f"Device {row.Sensorid}"
                })
        
        return devices

    def get_user_by_userid(self, userid: str) -> Optional[Dict]:
        """
        Get a specific user by their device userid
        
        Args:
            userid: Device user ID
        
        Returns:
            User dictionary or None if not found
        """
        if not self.conn:
            raise Exception("Database not connected")

        cursor = self.conn.cursor()
        query = """
            SELECT userid, UserCode, Name, Deptid, EmployDate, Telephone, Mobile
            FROM Userinfo
            WHERE userid = ?
        """
        
        cursor.execute(query, (userid,))
        row = cursor.fetchone()
        
        if row:
            return {
                'userid': str(row.userid),
                'userCode': str(row.UserCode) if row.UserCode else None,
                'name': row.Name,
                'deptid': row.Deptid,
                'employDate': str(row.EmployDate) if row.EmployDate else None,
                'telephone': row.Telephone,
                'mobile': row.Mobile
            }
        
        return None

    def get_user_by_code(self, user_code: str) -> Optional[Dict]:
        """
        Get a specific user by their UserCode (employee code)
        
        Args:
            user_code: Employee/User code
        
        Returns:
            User dictionary or None if not found
        """
        if not self.conn:
            raise Exception("Database not connected")

        cursor = self.conn.cursor()
        query = """
            SELECT userid, UserCode, Name, Deptid, EmployDate, Telephone, Mobile
            FROM Userinfo
            WHERE UserCode = ?
        """
        
        cursor.execute(query, (user_code,))
        row = cursor.fetchone()
        
        if row:
            return {
                'userid': str(row.userid),
                'userCode': str(row.UserCode) if row.UserCode else None,
                'name': row.Name,
                'deptid': row.Deptid,
                'employDate': str(row.EmployDate) if row.EmployDate else None,
                'telephone': row.Telephone,
                'mobile': row.Mobile
            }
        
        return None


# Test function
if __name__ == "__main__":
    DATABASE_PATH = r"E:\ANVIZ Crosschex Backup\DB\CrossChex.mdb"
    
    reader = CrossChexReader(DATABASE_PATH)
    
    if reader.connect():
        try:
            # Get users
            print("\n=== USERS ===")
            users = reader.get_users()
            print(f"Total users: {len(users)}")
            for user in users[:5]:  # Show first 5
                print(f"  {user}")
            
            # Get recent attendance
            print("\n=== RECENT ATTENDANCE ===")
            records = reader.get_attendance_records(limit=10)
            print(f"Total records: {len(records)}")
            for record in records:
                print(f"  {record}")
            
            # Get devices
            print("\n=== DEVICES ===")
            devices = reader.get_device_info()
            print(f"Total devices: {len(devices)}")
            for device in devices:
                print(f"  {device}")
            
            # Test date range query
            print("\n=== ATTENDANCE FOR DATE RANGE ===")
            yesterday = datetime.now() - timedelta(days=1)
            today = datetime.now()
            records = reader.get_attendance_records(start_date=yesterday, end_date=today)
            print(f"Records from yesterday to now: {len(records)}")
            
        finally:
            reader.close()
