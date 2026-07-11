using System;
using System.Collections.Generic;
using Microsoft.EntityFrameworkCore;
using Pomelo.EntityFrameworkCore.MySql.Scaffolding.Internal;

namespace BloodBankAPI.Models;

public partial class BloodBankMsContext : DbContext
{
    public BloodBankMsContext()
    {
    }

    public BloodBankMsContext(DbContextOptions<BloodBankMsContext> options)
        : base(options)
    {
    }

    public virtual DbSet<Admin> Admins { get; set; }

    public virtual DbSet<AuditLog> AuditLogs { get; set; }

    public virtual DbSet<BloodGroup> BloodGroups { get; set; }

    public virtual DbSet<BloodInventory> BloodInventories { get; set; }

    public virtual DbSet<BloodRequest> BloodRequests { get; set; }

    public virtual DbSet<BloodScreening> BloodScreenings { get; set; }

    public virtual DbSet<Donation> Donations { get; set; }

    public virtual DbSet<Donor> Donors { get; set; }

    public virtual DbSet<Hospital> Hospitals { get; set; }

    public virtual DbSet<Patient> Patients { get; set; }

   protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
{
    // Connection is configured in Program.cs via AddDbContext, so nothing to do here.
}
    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder
            .UseCollation("utf8mb4_unicode_ci")
            .HasCharSet("utf8mb4");

        modelBuilder.Entity<Admin>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PRIMARY");

            entity.ToTable("admins");

            entity.HasIndex(e => e.Email, "uq_admin_email").IsUnique();

            entity.HasIndex(e => e.Username, "uq_admin_username").IsUnique();

            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("CURRENT_TIMESTAMP")
                .HasColumnType("datetime")
                .HasColumnName("created_at");
            entity.Property(e => e.Email)
                .HasMaxLength(100)
                .HasColumnName("email");
            entity.Property(e => e.Name)
                .HasMaxLength(100)
                .HasColumnName("name");
            entity.Property(e => e.PasswordHash)
                .HasMaxLength(255)
                .HasColumnName("password_hash");
            entity.Property(e => e.UpdatedAt)
                .ValueGeneratedOnAddOrUpdate()
                .HasDefaultValueSql("CURRENT_TIMESTAMP")
                .HasColumnType("datetime")
                .HasColumnName("updated_at");
            entity.Property(e => e.Username)
                .HasMaxLength(50)
                .HasColumnName("username");
        });

        modelBuilder.Entity<AuditLog>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PRIMARY");

            entity.ToTable("audit_logs");

            entity.HasIndex(e => e.AdminId, "fk_audit_logs_admins");

            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.ActionPerformed)
                .HasMaxLength(255)
                .HasColumnName("action_performed");
            entity.Property(e => e.AdminId).HasColumnName("admin_id");
            entity.Property(e => e.IpAddress)
                .HasMaxLength(45)
                .HasColumnName("ip_address");
            entity.Property(e => e.RecordId).HasColumnName("record_id");
            entity.Property(e => e.TableAffected)
                .HasMaxLength(100)
                .HasColumnName("table_affected");
            entity.Property(e => e.Timestamp)
                .HasDefaultValueSql("CURRENT_TIMESTAMP")
                .HasColumnType("datetime")
                .HasColumnName("timestamp");

            entity.HasOne(d => d.Admin).WithMany(p => p.AuditLogs)
                .HasForeignKey(d => d.AdminId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("fk_audit_logs_admins");
        });

        modelBuilder.Entity<BloodGroup>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PRIMARY");

            entity.ToTable("blood_groups");

            entity.HasIndex(e => e.Code, "uq_blood_group_code").IsUnique();

            entity.Property(e => e.Id)
                .ValueGeneratedOnAdd()
                .HasColumnName("id");
            entity.Property(e => e.Code)
                .HasMaxLength(3)
                .HasColumnName("code");
        });

        modelBuilder.Entity<BloodInventory>(entity =>
        {
            entity.HasKey(e => e.BloodGroupId).HasName("PRIMARY");

            entity.ToTable("blood_inventory");

            entity.Property(e => e.BloodGroupId).HasColumnName("blood_group_id");
            entity.Property(e => e.LastUpdated)
                .ValueGeneratedOnAddOrUpdate()
                .HasDefaultValueSql("CURRENT_TIMESTAMP")
                .HasColumnType("datetime")
                .HasColumnName("last_updated");
            entity.Property(e => e.UnitsAvailable).HasColumnName("units_available");

            entity.HasOne(d => d.BloodGroup).WithOne(p => p.BloodInventory)
                .HasForeignKey<BloodInventory>(d => d.BloodGroupId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("fk_inventory_blood_groups");
        });

        modelBuilder.Entity<BloodRequest>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PRIMARY");

            entity.ToTable("blood_requests");

            entity.HasIndex(e => e.BloodGroupId, "fk_requests_blood_groups");

            entity.HasIndex(e => e.PatientId, "fk_requests_patients");

            entity.HasIndex(e => new { e.Status, e.RequestDate }, "idx_requests_status_date");

            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.BloodGroupId).HasColumnName("blood_group_id");
            entity.Property(e => e.PatientId).HasColumnName("patient_id");
            entity.Property(e => e.RequestDate)
                .HasDefaultValueSql("CURRENT_TIMESTAMP")
                .HasColumnType("datetime")
                .HasColumnName("request_date");
            entity.Property(e => e.Status)
                .HasDefaultValueSql("'Pending'")
                .HasColumnType("enum('Pending','Approved','Fulfilled','Cancelled')")
                .HasColumnName("status");
            entity.Property(e => e.UnitsRequested)
                .HasDefaultValueSql("'1'")
                .HasColumnName("units_requested");
            entity.Property(e => e.UpdatedAt)
                .ValueGeneratedOnAddOrUpdate()
                .HasDefaultValueSql("CURRENT_TIMESTAMP")
                .HasColumnType("datetime")
                .HasColumnName("updated_at");

            entity.HasOne(d => d.BloodGroup).WithMany(p => p.BloodRequests)
                .HasForeignKey(d => d.BloodGroupId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("fk_requests_blood_groups");

            entity.HasOne(d => d.Patient).WithMany(p => p.BloodRequests)
                .HasForeignKey(d => d.PatientId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("fk_requests_patients");
        });

        modelBuilder.Entity<BloodScreening>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PRIMARY");

            entity.ToTable("blood_screenings");

            entity.HasIndex(e => e.DonationId, "uq_screening_donation").IsUnique();

            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.DonationId).HasColumnName("donation_id");
            entity.Property(e => e.HepBStatus)
                .HasDefaultValueSql("'Negative'")
                .HasColumnType("enum('Negative','Positive')")
                .HasColumnName("hep_b_status");
            entity.Property(e => e.HepCStatus)
                .HasDefaultValueSql("'Negative'")
                .HasColumnType("enum('Negative','Positive')")
                .HasColumnName("hep_c_status");
            entity.Property(e => e.HivStatus)
                .HasDefaultValueSql("'Negative'")
                .HasColumnType("enum('Negative','Positive')")
                .HasColumnName("hiv_status");
            entity.Property(e => e.ScreeningDate)
                .HasDefaultValueSql("CURRENT_TIMESTAMP")
                .HasColumnType("datetime")
                .HasColumnName("screening_date");
            entity.Property(e => e.SyphilisStatus)
                .HasDefaultValueSql("'Negative'")
                .HasColumnType("enum('Negative','Positive')")
                .HasColumnName("syphilis_status");
            entity.Property(e => e.TechnicianNotes)
                .HasColumnType("text")
                .HasColumnName("technician_notes");

            entity.HasOne(d => d.Donation).WithOne(p => p.BloodScreening)
                .HasForeignKey<BloodScreening>(d => d.DonationId)
                .HasConstraintName("fk_screenings_donations");
        });

        modelBuilder.Entity<Donation>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PRIMARY");

            entity.ToTable("donations");

            entity.HasIndex(e => e.BloodGroupId, "fk_donations_blood_groups");

            entity.HasIndex(e => e.BloodRequestId, "fk_donations_blood_requests");

            entity.HasIndex(e => e.DonorId, "fk_donations_donors");

            entity.HasIndex(e => new { e.DonationStatus, e.ExpiryDate, e.BloodGroupId }, "idx_donations_inventory_mgmt");

            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.BloodGroupId).HasColumnName("blood_group_id");
            entity.Property(e => e.BloodRequestId).HasColumnName("blood_request_id");
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("CURRENT_TIMESTAMP")
                .HasColumnType("datetime")
                .HasColumnName("created_at");
            entity.Property(e => e.DonationDate)
                .HasDefaultValueSql("CURRENT_TIMESTAMP")
                .HasColumnType("datetime")
                .HasColumnName("donation_date");
            entity.Property(e => e.DonationStatus)
                .HasDefaultValueSql("'Available'")
                .HasColumnType("enum('Available','Utilized','Expired','Discarded')")
                .HasColumnName("donation_status");
            entity.Property(e => e.DonorId).HasColumnName("donor_id");
            entity.Property(e => e.ExpiryDate).HasColumnName("expiry_date");
            entity.Property(e => e.ScreeningStatus)
                .HasDefaultValueSql("'Pending'")
                .HasColumnType("enum('Pending','Passed','Failed')")
                .HasColumnName("screening_status");
            entity.Property(e => e.Units)
                .HasDefaultValueSql("'1'")
                .HasColumnName("units");

            entity.HasOne(d => d.BloodGroup).WithMany(p => p.Donations)
                .HasForeignKey(d => d.BloodGroupId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("fk_donations_blood_groups");

            entity.HasOne(d => d.BloodRequest).WithMany(p => p.Donations)
                .HasForeignKey(d => d.BloodRequestId)
                .OnDelete(DeleteBehavior.SetNull)
                .HasConstraintName("fk_donations_blood_requests");

            entity.HasOne(d => d.Donor).WithMany(p => p.Donations)
                .HasForeignKey(d => d.DonorId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("fk_donations_donors");
        });

        modelBuilder.Entity<Donor>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PRIMARY");

            entity.ToTable("donors");

            entity.HasIndex(e => new { e.Id, e.Phone }, "idx_donors_id_phone");

            entity.HasIndex(e => new { e.BloodGroupId, e.Phone, e.LastName, e.FirstName }, "idx_donors_search");

            entity.HasIndex(e => e.Email, "uq_donor_email").IsUnique();

            entity.HasIndex(e => e.Phone, "uq_donor_phone").IsUnique();

            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.Address)
                .HasColumnType("text")
                .HasColumnName("address");
            entity.Property(e => e.BloodGroupId).HasColumnName("blood_group_id");
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("CURRENT_TIMESTAMP")
                .HasColumnType("datetime")
                .HasColumnName("created_at");
            entity.Property(e => e.DateOfBirth).HasColumnName("date_of_birth");
            entity.Property(e => e.EligibilityStatus)
                .HasDefaultValueSql("'Eligible'")
                .HasColumnType("enum('Eligible','Deferred_Temporary','Deferred_Permanent')")
                .HasColumnName("eligibility_status");
            entity.Property(e => e.Email)
                .HasMaxLength(100)
                .HasColumnName("email");
            entity.Property(e => e.FirstName)
                .HasMaxLength(50)
                .HasColumnName("first_name");
            entity.Property(e => e.Gender)
                .HasColumnType("enum('Male','Female','Other')")
                .HasColumnName("gender");
            entity.Property(e => e.LastDonationDate).HasColumnName("last_donation_date");
            entity.Property(e => e.LastName)
                .HasMaxLength(50)
                .HasColumnName("last_name");
            entity.Property(e => e.Phone)
                .HasMaxLength(20)
                .HasColumnName("phone");
            entity.Property(e => e.RegistrationDate).HasColumnName("registration_date");
            entity.Property(e => e.UpdatedAt)
                .ValueGeneratedOnAddOrUpdate()
                .HasDefaultValueSql("CURRENT_TIMESTAMP")
                .HasColumnType("datetime")
                .HasColumnName("updated_at");

            entity.HasOne(d => d.BloodGroup).WithMany(p => p.Donors)
                .HasForeignKey(d => d.BloodGroupId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("fk_donors_blood_groups");
        });

        modelBuilder.Entity<Hospital>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PRIMARY");

            entity.ToTable("hospitals");

            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.Address)
                .HasColumnType("text")
                .HasColumnName("address");
            entity.Property(e => e.ContactNumber)
                .HasMaxLength(20)
                .HasColumnName("contact_number");
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("CURRENT_TIMESTAMP")
                .HasColumnType("datetime")
                .HasColumnName("created_at");
            entity.Property(e => e.Name)
                .HasMaxLength(150)
                .HasColumnName("name");
        });

        modelBuilder.Entity<Patient>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PRIMARY");

            entity.ToTable("patients");

            entity.HasIndex(e => e.BloodGroupId, "fk_patients_blood_groups");

            entity.HasIndex(e => e.HospitalId, "fk_patients_hospitals");

            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.BloodGroupId).HasColumnName("blood_group_id");
            entity.Property(e => e.ContactNumber)
                .HasMaxLength(20)
                .HasColumnName("contact_number");
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("CURRENT_TIMESTAMP")
                .HasColumnType("datetime")
                .HasColumnName("created_at");
            entity.Property(e => e.FirstName)
                .HasMaxLength(50)
                .HasColumnName("first_name");
            entity.Property(e => e.HospitalId).HasColumnName("hospital_id");
            entity.Property(e => e.LastName)
                .HasMaxLength(50)
                .HasColumnName("last_name");
            entity.Property(e => e.TreatingDoctor)
                .HasMaxLength(100)
                .HasColumnName("treating_doctor");
            entity.Property(e => e.UpdatedAt)
                .ValueGeneratedOnAddOrUpdate()
                .HasDefaultValueSql("CURRENT_TIMESTAMP")
                .HasColumnType("datetime")
                .HasColumnName("updated_at");

            entity.HasOne(d => d.BloodGroup).WithMany(p => p.Patients)
                .HasForeignKey(d => d.BloodGroupId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("fk_patients_blood_groups");

            entity.HasOne(d => d.Hospital).WithMany(p => p.Patients)
                .HasForeignKey(d => d.HospitalId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("fk_patients_hospitals");
        });

        OnModelCreatingPartial(modelBuilder);
    }

    partial void OnModelCreatingPartial(ModelBuilder modelBuilder);
}
