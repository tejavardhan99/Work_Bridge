# MongoDB Atlas Connection Troubleshooting Guide

## Current Issue
You're experiencing SSL/TLS handshake errors when connecting to MongoDB Atlas, even though your connection string is configured in `.env`.

### Error Details
```
SSL: TLSV1_ALERT_INTERNAL_ERROR - tlsv1 alert internal error
```

This typically means:
1. **IP NOT whitelisted** in MongoDB Atlas (most common)
2. **Invalid credentials** in connection string  
3. **Network/firewall blocking** the connection
4. **Database/cluster doesn't exist** with those credentials

---

## Step-by-Step Fix

### 1. Verify Your Connection String
Your current connection string:
```
mongodb+srv://lenkatejavardhan9989_db_user:dZUdY5gqYlVVla4P@cluster0.u5disq6.mongodb.net/?appName=Cluster0
```

**Check:**
- ✓ Format is `mongodb+srv://username:password@cluster.mongodb.net/?appName=...`
- ✓ Username: `lenkatejavardhan9989_db_user`
- ✓ Database: `workbridge`

---

### 2. Check IP Whitelist in MongoDB Atlas (CRITICAL)

**This is the #1 cause of your issue!**

1. Go to [MongoDB Atlas Console](https://cloud.mongodb.com/)
2. Log in with your account
3. Navigate to **Security > Network Access**
4. Look for IP whitelist entries
5. **Add your current IP address:**
   - Click "Add IP Address"
   - Choose "Current IP Address" (if available)
   - Or manually add: `0.0.0.0/0` (allows all IPs, for development only)
   - Set expiry to never

**What's your external IP?** Check at https://whatismyipaddress.com/

---

### 3. Verify Database User Credentials

1. In MongoDB Atlas Console → **Database Access**
2. Find user: `lenkatejavardhan9989_db_user`
3. Verify the password matches in your `.env` file: `dZUdY5gqYlVVla4P`
4. If password is wrong:
   - Edit user → Change password
   - Update `.env` with new password
   - Restart Django

---

### 4. Test Connection with MongoDB Connection String

1. In MongoDB Atlas → Click your cluster
2. Click "Connect" button
3. Choose "Connect with MongoDB Compass" or "Connect with MongoDB Shell"
4. Copy the connection string
5. Replace username and password
6. Test with your MongoDB client tool

---

### 5. Django Code Updated

The following fixes have been applied to your codebase:

#### File: `apps/common/mongodb.py`

**What was fixed:**
- ✓ Added TLS configuration for `mongodb+srv://` protocol
- ✓ Added `retryWrites=True` for Atlas reliability
- ✓ Added `tlsAllowInvalidCertificates=True` as workaround
- ✓ Improved error logging for diagnostics

**New connection parameters:**
```python
{
    "tls": True,                            # Enable TLS for secure connection
    "retryWrites": True,                    # Retry writes for reliability
    "tlsAllowInvalidCertificates": True,   # Workaround for SSL issues
    "w": "majority",                        # Write concern for Atlas
    "connectTimeoutMS": 5000,              # Connection timeout
    "serverSelectionTimeoutMS": 5000,      # Server selection timeout
}
```

---

## Quick Test Commands

### Test Django Connection
```bash
cd d:\CSP_pro
python manage.py shell
>>> from apps.common.mongodb import ping_mongodb
>>> result = ping_mongodb()
>>> print(result)
```

Expected output if working:
```python
{'connected': True, 'status': 'connected', 'database': 'workbridge', 'target': 'mongodb_atlas'}
```

### Test Health Endpoint
Once connection works, test the API:
```bash
curl http://localhost:8000/api/v1/health/status/
```

---

## Common Mistakes to Avoid

| Mistake | Fix |
|---------|-----|
| IP not whitelisted | Add `0.0.0.0/0` or your IP in Network Access |
| Wrong password | Update in `MONGODB_ATLAS_URI` in `.env` |
| Using `mongodb://` instead of `mongodb+srv://` | Already fixed - use srv protocol |
| Old/stale connection cached | Restart Django with `python manage.py runserver` |
| Firewall blocking 27017 | Contact your network admin or use VPN |

---

## Step to Verify Fix Works

1. **Update `.env`** if connection string changed
2. **Restart Django:**
   ```bash
   python manage.py runserver
   ```
3. **Try worker registration:**
   ```bash
   curl -X POST http://localhost:8000/api/v1/auth/worker-register/ \
     -H "Content-Type: application/json" \
     -d '{
       "name": "Test Worker",
       "phone": "+919876543210",
       "password": "Test@1234"
     }'
   ```
4. **Check if data appears in MongoDB Atlas:**
   - Go to MongoDB Atlas → Collections
   - Look for `workbridge.workers` collection
   - Should see your test record

---

## If Still Not Working

1. Check Django logs for full error message
2. Verify cluster still exists in MongoDB Atlas
3. Try with `pymongo` directly:

```python
from pymongo import MongoClient
uri = "mongodb+srv://lenkatejavardhan9989_db_user:dZUdY5gqYlVVla4P@cluster0.u5disq6.mongodb.net/workbridge?appName=Cluster0"
client = MongoClient(uri, tlsAllowInvalidCertificates=True)
db = client["workbridge"]
print(db.command("ping"))
```

4. If direct PyMongo works but Django doesn't, clear MongoEngine cache:
   ```bash
   pkill -f "python manage.py"
   python manage.py shell
   ```

---

## Production Checklist

- [ ] IP whitelist set correctly (not `0.0.0.0/0`)
- [ ] Credentials are secure (use environment variables)
- [ ] Backups enabled in MongoDB Atlas
- [ ] Monitoring/alerts configured
- [ ] Connection pooling optimized
- [ ] Tested worker registration end-to-end

